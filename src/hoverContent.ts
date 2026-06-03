export function hoverContentsToMarkdownLines(contents: readonly unknown[]): string[] {
  const lines: string[] = [];

  for (const content of contents) {
    if (typeof content === 'string') {
      lines.push(...splitLines(content));
      continue;
    }

    if (!content || typeof content !== 'object') {
      continue;
    }

    const maybeValue = (content as { value?: unknown }).value;
    const maybeLanguage = (content as { language?: unknown }).language;
    if (typeof maybeValue !== 'string') {
      continue;
    }

    if (typeof maybeLanguage === 'string' && maybeLanguage.length > 0) {
      lines.push(`\`\`\`${maybeLanguage}`, ...splitLines(maybeValue), '```');
    } else {
      lines.push(...splitLines(maybeValue));
    }
  }

  return lines;
}

function splitLines(value: string): string[] {
  return value.split(/\r?\n/);
}
