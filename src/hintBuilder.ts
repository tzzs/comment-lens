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
  hintPrefix?: string;
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
const CANDIDATE_SCAN_MULTIPLIER = 3;
const MIN_EXTRA_SCAN_CANDIDATES = 10;
const GO_RESOLVE_TIMEOUT_MS = 2500;

export async function buildCommentHints(input: BuildCommentHintsInput): Promise<CommentHint[]> {
  if (!input.config.enabled || !input.config.languages.includes(input.languageId)) {
    return [];
  }

  const candidates = scanCandidateSymbols(
    input.lines,
    input.range,
    input.languageId,
    getCandidateScanLimit(input.config.maxHintsPerRequest)
  );
  const candidatesToResolve = dedupeCandidates(
    candidates.filter((candidate) => shouldResolveCandidate(candidate, input))
  ).slice(0, input.config.maxHintsPerRequest);
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

    const hint: CommentHint = {
      line: candidate.line,
      character: getLineEndCharacter(input.lines, candidate.line),
      label: `${input.config.hintPrefix ?? '// '}${documentation.summary}`,
      tooltip: documentation.fullText
    };
    if (documentation.location) {
      hint.location = documentation.location;
    }

    addHint(hints, hint, input.config.dedupeLineHints);
  }

  return hints;
}

function getLineEndCharacter(lines: readonly string[], lineNumber: number): number {
  return (lines[lineNumber] ?? '').length;
}

function getCandidateScanLimit(maxHintsPerRequest: number): number {
  return Math.max(
    maxHintsPerRequest * CANDIDATE_SCAN_MULTIPLIER,
    maxHintsPerRequest + MIN_EXTRA_SCAN_CANDIDATES
  );
}

function dedupeCandidates(candidates: readonly SymbolCandidate[]): SymbolCandidate[] {
  const seen = new Set<string>();
  const deduped: SymbolCandidate[] = [];
  for (const candidate of candidates) {
    const key = `${candidate.word}:${candidate.line}:${candidate.startCharacter}:${candidate.endCharacter}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push(candidate);
  }

  return deduped;
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
    getResolveTimeoutMs(input)
  );
  if (!documentation || input.isCancellationRequested?.()) {
    return undefined;
  }

  return { candidate, documentation };
}

function getResolveTimeoutMs(input: BuildCommentHintsInput): number {
  if (input.languageId === 'go') {
    return Math.max(input.config.resolveTimeoutMs, GO_RESOLVE_TIMEOUT_MS);
  }

  return input.config.resolveTimeoutMs;
}

function shouldResolveCandidate(candidate: SymbolCandidate, input: BuildCommentHintsInput): boolean {
  if (input.isCancellationRequested?.()) {
    return false;
  }

  const line = input.lines[candidate.line] ?? '';
  if (
    isDeclarationName(candidate, line) ||
    isGoDeclarationName(candidate, line, input.languageId) ||
    isGoDeclarationContext(candidate, line, input.languageId) ||
    isDeclarationContext(candidate, line) ||
    isJsxTagName(candidate, line, input.languageId) ||
    isJsxAttributeName(candidate, line, input.languageId)
  ) {
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

function isGoDeclarationName(candidate: SymbolCandidate, line: string, languageId: string): boolean {
  if (languageId !== 'go') {
    return false;
  }

  const beforeCandidate = line.slice(0, candidate.startCharacter);
  if (/\bfunc(?:\s*\([^)]*\))?\s+$/.test(beforeCandidate)) {
    return true;
  }

  const trimmedStart = line.search(/\S/);
  if (trimmedStart !== candidate.startCharacter) {
    return false;
  }

  const afterCandidate = line.slice(candidate.endCharacter);
  return afterCandidate.includes('=') && !afterCandidate.trimStart().startsWith(':=');
}

function isGoDeclarationContext(candidate: SymbolCandidate, line: string, languageId: string): boolean {
  if (languageId !== 'go') {
    return false;
  }

  const trimmedLine = line.trimStart();
  const leadingWhitespace = line.length - trimmedLine.length;
  if (trimmedLine.startsWith('func ')) {
    const bodyStart = line.indexOf('{');
    if (bodyStart < 0 || candidate.startCharacter < bodyStart) {
      return true;
    }
  }

  const shortDeclaration = line.indexOf(':=');
  if (shortDeclaration >= 0 && candidate.startCharacter >= leadingWhitespace && candidate.endCharacter <= shortDeclaration) {
    return true;
  }

  const assignment = findGoAssignmentOperator(line);
  if (assignment >= 0 && candidate.startCharacter >= leadingWhitespace && candidate.endCharacter <= assignment) {
    return true;
  }

  return false;
}

function findGoAssignmentOperator(line: string): number {
  for (let index = 0; index < line.length; index++) {
    if (line[index] !== '=') {
      continue;
    }

    const previous = line[index - 1];
    const next = line[index + 1];
    if (previous === ':' || previous === '=' || previous === '!' || previous === '<' || previous === '>' || next === '=') {
      continue;
    }

    return index;
  }

  return -1;
}

function isDeclarationContext(candidate: SymbolCandidate, line: string): boolean {
  const next = nextNonWhitespaceCharacter(line, candidate.endCharacter);
  if (next !== ':') {
    return false;
  }

  return !/\bcase\s+$/.test(line.slice(0, candidate.startCharacter));
}

function nextNonWhitespaceCharacter(line: string, startCharacter: number): string | undefined {
  for (let character = startCharacter; character < line.length; character++) {
    if (!/\s/.test(line[character])) {
      return line[character];
    }
  }

  return undefined;
}

function isJsxTagName(candidate: SymbolCandidate, line: string, languageId: string): boolean {
  if (languageId !== 'typescriptreact' && languageId !== 'javascriptreact') {
    return false;
  }

  const beforeCandidate = line.slice(0, candidate.startCharacter).trimEnd();
  return beforeCandidate.endsWith('<') || beforeCandidate.endsWith('</');
}

function isJsxAttributeName(candidate: SymbolCandidate, line: string, languageId: string): boolean {
  if (languageId !== 'typescriptreact' && languageId !== 'javascriptreact') {
    return false;
  }

  if (line[candidate.endCharacter] !== '=') {
    return false;
  }

  const beforeCandidate = line.slice(0, candidate.startCharacter);
  return beforeCandidate.lastIndexOf('<') > beforeCandidate.lastIndexOf('>');
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
