export interface FormattedDocumentation {
  summary: string;
  fullText: string;
}

export function formatDocumentation(
  markdownLines: readonly string[],
  maxHintLength: number
): FormattedDocumentation | undefined {
  const normalized = normalizeDocumentation(markdownLines);
  if (normalized.length === 0) {
    return undefined;
  }

  const fullText = normalized.join('\n');
  const summary = truncate(normalized[0], maxHintLength);

  return { summary, fullText };
}

function normalizeDocumentation(markdownLines: readonly string[]): string[] {
  const lines: string[] = [];
  let inCodeBlock = false;

  for (const rawLine of markdownLines) {
    const trimmed = rawLine.trim();

    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock || trimmed.length === 0) {
      continue;
    }

    const cleaned = cleanCommentMarker(trimmed);
    if (cleaned.length > 0) {
      lines.push(cleaned);
    }
  }

  return lines;
}

function cleanCommentMarker(line: string): string {
  return line
    .replace(/^\/\*\*?/, '')
    .replace(/\*\/$/, '')
    .replace(/^\*/, '')
    .replace(/^\/\//, '')
    .trim();
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxLength - 1))}...`;
}
