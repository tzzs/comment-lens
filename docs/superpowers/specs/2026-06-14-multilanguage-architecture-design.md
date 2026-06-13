# Comment Doc Lens Multilanguage Architecture Design

## Context

Comment Doc Lens currently displays definition comments and symbol documentation as display-only VS Code inlay hints. The current release supports Go, TypeScript, JavaScript, TSX, and JSX through a mostly shared pipeline:

- scan visible identifiers;
- resolve documentation through VS Code hover and definition providers;
- fall back to source comments for Go when language-service hover output is not useful;
- format the first useful documentation line as an end-of-line inlay hint.

This works for the first version, but language-specific behavior is already leaking into the core extension path. Go has custom fallback behavior, TSX/JSX need special noise filtering, and future languages will need different comment formats, declaration filters, timeout expectations, and documentation-quality expectations.

The next phase should prioritize a stable language architecture before broad language expansion. Broader language support and user-experience improvements remain part of the plan, but they should build on the adapter model rather than adding more one-off conditions to the core pipeline.

## Goals

- Introduce a language adapter and registry architecture for all language-specific behavior.
- Move existing Go and TypeScript-family behavior into adapters without changing product behavior.
- Establish a language support matrix that records support level, dependencies, comment styles, fallback strategy, and verification status.
- Add future languages in batches, starting with Python, Java, Rust, and C#.
- Keep the extension's product boundary: display-only inlay hints for documentation comments and symbol documentation, not runtime values.
- Define clear validation gates for each stage so implementation work can be delegated to Codex safely.

## Non-Goals

- Do not support every language as stable in one pass.
- Do not add jump actions, hover actions, or command links to the inlay hints.
- Do not infer runtime values or execute project code.
- Do not continue growing core pipeline files with language-specific special cases.
- Do not require users to install every language extension; unsupported or unavailable language services should degrade quietly.

## Proposed Architecture

The extension should be organized into three layers.

| Layer | Responsibility | Example Modules |
| --- | --- | --- |
| Core Pipeline | Scan visible text, schedule documentation resolution, enforce budgets, format and dedupe hints | `hintBuilder`, `documentationResolver`, `documentationFormatter` |
| Language Registry | Map VS Code `languageId` values to language adapters and expose enabled languages | `languageRegistry` |
| Language Adapters | Define language-specific comments, declaration filtering, noise filtering, fallback lookup, and timeout behavior | `languages/go`, `languages/typescriptFamily`, `languages/python` |

The adapter boundary should make it possible to add or change a language without editing the core hint pipeline.

### Adapter Contract

The exact TypeScript names can change during implementation, but the contract should cover these capabilities:

```ts
interface LanguageAdapter {
  languageIds: readonly string[];
  displayName: string;
  supportLevel: 'stable' | 'experimental' | 'hover-only';

  isDeclarationCandidate?(candidate: SymbolCandidate, line: string): boolean;
  isNoisyCandidate?(candidate: SymbolCandidate, line: string): boolean;

  sourceComment?: {
    canRead(location: LocationLike): boolean;
    findDefinitionLine?(
      document: SourceDocument,
      candidate: SymbolCandidate,
      location: LocationLike
    ): number | undefined;
    collectLeadingComments(document: SourceDocument, definitionLine: number): string[];
  };

  resolveTimeoutMs?: number;
}
```

Adapters should describe behavior, not own the whole pipeline. The core remains responsible for cancellation, cache limits, hint placement, formatting, and display-only inlay hint construction.

### Registry Behavior

The registry should:

- expose the full list of supported VS Code language ids for activation and provider registration;
- resolve a `languageId` to one adapter;
- support existing `commentDocLens.languages` configuration without breaking compatibility;
- make support level and dependency metadata available to documentation and tests.

The initial registry should include:

- Go adapter: `go`;
- TypeScript-family adapter: `typescript`, `javascript`, `typescriptreact`, `javascriptreact`.

## Data Flow

The runtime path should stay close to the current behavior:

1. VS Code activates the extension for registered language ids and commands.
2. The inlay hint provider receives a document and range.
3. The provider asks the language registry for the document adapter.
4. The candidate scanner collects visible identifiers.
5. The core pipeline applies common filters plus adapter-specific declaration and noise filters.
6. The resolver attempts reference hover documentation.
7. The resolver asks for a definition location when needed, or when source fallback can improve low-quality hover text.
8. The resolver attempts definition hover documentation.
9. If enabled by the adapter, the resolver attempts source comment fallback near the definition.
10. The formatter extracts the first useful documentation summary and truncates it according to settings.
11. The hint builder deduplicates line summaries, applies budgets, positions hints at line end, and returns display-only inlay hints.

## Existing Language Migration

### Go

Move Go-specific behavior out of the core files:

- local definition fallback for Go identifiers;
- Go declaration-context filtering;
- longer Go resolve timeout;
- Go source comment fallback from `//` and `/* */` comments.

Verification must prove that existing Go behavior does not regress.

### TypeScript Family

Move TypeScript, JavaScript, TSX, and JSX behavior into a shared adapter:

- declaration-name filtering for `class`, `const`, `enum`, `function`, `interface`, `let`, `type`, and `var`;
- property-chain tail preference;
- JSX tag-name filtering;
- JSX attribute-name filtering.

Verification must prove that TS, JS, TSX, and JSX fixtures still produce useful hints without tag or attribute noise.

## Language Expansion Strategy

Language support should use three support levels.

| Level | Meaning | Entry Criteria |
| --- | --- | --- |
| `stable` | Default supported and recommended in documentation | Fixtures, tests, docs, and common comment patterns are covered |
| `experimental` | Available but documented with known limits | Basic hover or fallback behavior works for representative fixtures |
| `hover-only` | Depends only on language-service hover or definition output | Useful enough to expose, but no custom source fallback yet |

First expansion batch:

| Language | Initial Level | Rationale | Verification Focus |
| --- | --- | --- | --- |
| Python | `experimental`, then `stable` | High value and strong docstring conventions | Function/class docstrings, variable references, quiet degradation |
| Java | `experimental` | Javadoc is common and language services are mature | Class, method, field Javadoc |
| Rust | `experimental` | `///` doc comments are common and structured | Function, struct, enum variant docs |
| C# | `hover-only`, then `experimental` | XML docs are common but VS Code behavior depends heavily on extensions | `/// <summary>` hover quality and fallback feasibility |

Second expansion batch:

- PHP;
- Ruby;
- Kotlin;
- Swift;
- C/C++.

Each language must enter the support matrix before or alongside implementation.

## User Experience Plan

User-experience work should follow the adapter migration, not precede it.

Planned UX improvements:

- keep `commentDocLens.languages` backward compatible;
- add per-language configuration only after the registry exists;
- document language-specific dependencies and support levels;
- improve noisy-hint filtering through adapter-specific rules;
- preserve display-only hint behavior;
- keep `commentDocLens.toggle` and `commentDocLens.refresh` behavior stable;
- consider clearer setting descriptions once support levels exist.

## Error Handling and Degradation

| Risk | Required Behavior |
| --- | --- |
| Language service is missing | Return no hints quietly and document the dependency |
| Hover text is only a signature | Formatter and adapter rules should avoid showing signature-only noise when possible |
| Definition provider is slow | Enforce core timeout and allow adapter-specific timeout overrides |
| Source fallback is uncertain | Enable fallback only for adapters with explicit rules and tests |
| Large files generate many candidates | Respect `maxHintsPerRequest`, scan budget, concurrency limit, cancellation, and cache bounds |
| Configuration disables a language | The provider should return no hints for that language |

## Verification Plan

| Stage | Verification | Passing Standard |
| --- | --- | --- |
| Adapter architecture | `npm test` | Existing unit tests pass after migration |
| Registry | New registry unit tests | Every language id resolves to the expected adapter, and disabled languages do not run |
| Go migration | Go adapter unit tests and existing integration fixture | Go source fallback still extracts `//` and block comments |
| TypeScript-family migration | Existing hint builder and integration tests | TS/JS/TSX/JSX hints remain useful and JSX noise remains filtered |
| Documentation resolver | Resolver tests | Reference hover, definition hover, source fallback, cache bounds, and max length still work |
| Python adapter | Python fixture and tests | Function and class docstrings can produce hints; missing language service degrades quietly |
| Java adapter | Java fixture and tests | Javadoc for classes, methods, and fields can produce hints |
| Rust adapter | Rust fixture and tests | `///` comments for functions, structs, and enum variants can produce hints |
| C# adapter | C# fixture and tests | XML summary hover output is displayed when available |
| Performance | Timeout, cancellation, and cache tests | Slow providers do not produce stale hints and cache limits remain bounded |
| Documentation | README or docs review | Support matrix, dependencies, support levels, and limits are complete |
| Release readiness | `npm run compile`, `npm test`, optional `npm run test:integration`, `npm run package` | Compile, unit tests, and package pass; integration issues are documented with exact failure details |

## Implementation Phases

| Phase | Priority | Goal | Deliverables | Acceptance Criteria |
| --- | ---: | --- | --- | --- |
| P0.1 | Highest | Create language adapter and registry foundation | Adapter types, registry, registry tests | Core can resolve adapters and current language ids are registered |
| P0.2 | Highest | Migrate Go and TypeScript-family behavior | `go` adapter, `typescriptFamily` adapter, migrated filters and fallback | Existing tests pass with no behavior regression |
| P0.3 | Highest | Create language support matrix | README section or `docs/language-support.md` | Matrix lists level, dependencies, fallback, limits, and verification status |
| P1.1 | High | Add Python | Python adapter, fixtures, tests, docs | Python docstrings produce useful hints or degrade quietly |
| P1.2 | High | Add Java, Rust, and C# | Adapters, fixtures, tests, docs | Each language has an explicit support level and basic verification |
| P2.1 | Medium | Improve per-language UX | Backward-compatible configuration updates | Users can enable or disable behavior by language without breaking old settings |
| P2.2 | Medium | Improve performance and noise control | More timeout, cancellation, cache, and filter tests | Large files and slow language services stay bounded |
| P3 | Medium Low | Evaluate second-batch languages | PHP, Ruby, Kotlin, Swift, C/C++ assessment or adapters | Each language is accepted into `experimental` or `hover-only`, or rejected with rationale |

## Codex Execution Goal

Use this as the implementation objective:

```md
Upgrade Comment Doc Lens to a scalable multilanguage architecture.

First, introduce a language adapter and registry layer. Move existing Go, TypeScript, JavaScript, TSX, and JSX behavior into adapters while preserving all current user-visible behavior. Existing tests and integration expectations must not regress.

Second, create a language support matrix that records support level, required VS Code language extensions, supported comment styles, fallback strategy, known limits, and verification status.

Third, add Python, Java, Rust, and C# in that order where practical. Each language must include adapter metadata, fixtures, tests, documentation, and explicit degradation behavior.

Finally, improve user experience and reliability through per-language settings, better noise filtering, timeout/cancellation behavior, cache bounds, and large-file budgets.

Keep the product boundary unchanged: display-only inlay hints that summarize documentation comments or language-service symbol documentation. Do not add jump actions, hover actions, or runtime value inference.
```
