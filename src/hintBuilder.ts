import { scanCandidateSymbols, type LineRange, type SymbolCandidate } from './candidateScanner';
import type { LocationLike, ResolvedDocumentation } from './documentationResolver';

export interface CommentDocLensConfig {
  enabled: boolean;
  languages: readonly string[];
  maxHintsPerRequest: number;
  minIdentifierLength: number;
  preferPropertyTail: boolean;
  dedupeLineHints: boolean;
  resolveTimeoutMs: number;
}

export interface CommentHint {
  line: number;
  character: number;
  label: string;
  tooltip: string;
  location?: LocationLike;
}

export interface CommentHintResolver {
  resolve(
    candidate: SymbolCandidate,
    documentUri: string,
    documentVersion: number
  ): Promise<ResolvedDocumentation | undefined>;
}

export interface BuildCommentHintsInput {
  lines: readonly string[];
  range: LineRange;
  languageId: string;
  documentUri: string;
  documentVersion: number;
  config: CommentDocLensConfig;
  resolver: CommentHintResolver;
  isCancellationRequested?: () => boolean;
}

const MAX_CONCURRENT_RESOLVES = 4;

export async function buildCommentHints(input: BuildCommentHintsInput): Promise<CommentHint[]> {
  if (!input.config.enabled || !input.config.languages.includes(input.languageId)) {
    return [];
  }

  const candidates = scanCandidateSymbols(
    input.lines,
    input.range,
    input.languageId,
    input.config.maxHintsPerRequest
  );
  const candidatesToResolve = candidates.filter((candidate) => shouldResolveCandidate(candidate, input));
  const resolvedByCandidate = await mapWithConcurrency(
    candidatesToResolve,
    MAX_CONCURRENT_RESOLVES,
    async (candidate) => resolveCandidate(candidate, input)
  );
  const hints: CommentHint[] = [];

  for (const resolved of resolvedByCandidate) {
    if (!resolved) {
      continue;
    }

    const { candidate, documentation } = resolved;
    if (candidate.word.length < input.config.minIdentifierLength && !documentation.location) {
      continue;
    }

    const hint = {
      line: candidate.line,
      character: candidate.endCharacter,
      label: `// ${documentation.summary}`,
      tooltip: documentation.fullText,
      location: documentation.location
    };

    addHint(hints, hint, input.config.dedupeLineHints);
  }

  return hints;
}

async function resolveCandidate(
  candidate: SymbolCandidate,
  input: BuildCommentHintsInput
): Promise<{ candidate: SymbolCandidate; documentation: ResolvedDocumentation } | undefined> {
  if (input.isCancellationRequested?.()) {
    return undefined;
  }

  const documentation = await withTimeout(
    input.resolver.resolve(candidate, input.documentUri, input.documentVersion),
    input.config.resolveTimeoutMs
  );
  if (!documentation || input.isCancellationRequested?.()) {
    return undefined;
  }

  return { candidate, documentation };
}

function shouldResolveCandidate(candidate: SymbolCandidate, input: BuildCommentHintsInput): boolean {
  if (input.isCancellationRequested?.()) {
    return false;
  }

  const line = input.lines[candidate.line] ?? '';
  if (isDeclarationName(candidate, line) || isJsxTagName(candidate, line, input.languageId)) {
    return false;
  }

  if (!input.config.preferPropertyTail) {
    return true;
  }

  return line[candidate.endCharacter] !== '.';
}

function isDeclarationName(candidate: SymbolCandidate, line: string): boolean {
  const beforeCandidate = line.slice(0, candidate.startCharacter);
  return /\b(?:class|const|enum|function|interface|let|type|var)\s+$/.test(beforeCandidate);
}

function isJsxTagName(candidate: SymbolCandidate, line: string, languageId: string): boolean {
  if (languageId !== 'typescriptreact' && languageId !== 'javascriptreact') {
    return false;
  }

  const beforeCandidate = line.slice(0, candidate.startCharacter).trimEnd();
  return beforeCandidate.endsWith('<') || beforeCandidate.endsWith('</');
}

function addHint(hints: CommentHint[], hint: CommentHint, dedupeLineHints: boolean): void {
  if (!dedupeLineHints) {
    hints.push(hint);
    return;
  }

  const exactDuplicate = hints.find(
    (existing) =>
      existing.line === hint.line &&
      existing.character === hint.character &&
      existing.label === hint.label
  );
  if (exactDuplicate) {
    if (!exactDuplicate.location && hint.location) {
      exactDuplicate.location = hint.location;
    }
    return;
  }

  const sameLineSummaryIndex = hints.findIndex(
    (existing) => existing.line === hint.line && existing.label === hint.label
  );
  if (sameLineSummaryIndex >= 0) {
    if (!hints[sameLineSummaryIndex].location && hint.location) {
      hints[sameLineSummaryIndex] = hint;
    }
    return;
  }

  hints.push(hint);
}

async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function runWorker(): Promise<void> {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex++;
      results[currentIndex] = await worker(items[currentIndex]);
    }
  }

  const workerCount = Math.min(limit, items.length);
  await Promise.all(Array.from({ length: workerCount }, () => runWorker()));
  return results;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | undefined> {
  let timeout: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<undefined>((resolve) => {
    timeout = setTimeout(() => resolve(undefined), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}
