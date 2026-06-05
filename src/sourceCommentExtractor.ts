export interface SourceLineReader {
  lineAt(line: number): { text: string };
}

export interface GoDefinitionReader extends SourceLineReader {
  lineCount: number;
}

export function collectLeadingCommentLines(document: SourceLineReader, definitionLine: number): string[] {
  const collected: string[] = [];
  let line = definitionLine - 1;

  while (line >= 0) {
    const text = document.lineAt(line).text.trim();
    if (text.length === 0) {
      if (collected.length === 0) {
        line--;
        continue;
      }
      break;
    }

    if (text.startsWith('//')) {
      collected.unshift(text);
      line--;
      continue;
    }

    break;
  }

  if (collected.length > 0) {
    return collected;
  }

  return collectLeadingBlockCommentLines(document, definitionLine);
}

function collectLeadingBlockCommentLines(document: SourceLineReader, definitionLine: number): string[] {
  const collected: string[] = [];
  let line = definitionLine - 1;
  let foundEnd = false;

  while (line >= 0) {
    const text = document.lineAt(line).text.trim();
    if (text.length === 0 && !foundEnd) {
      line--;
      continue;
    }

    if (!foundEnd && text.endsWith('*/')) {
      foundEnd = true;
    }

    if (!foundEnd) {
      break;
    }

    collected.unshift(text);
    if (text.startsWith('/*')) {
      return collected;
    }

    line--;
  }

  return [];
}

export function findGoDefinitionLine(
  document: GoDefinitionReader,
  word: string,
  referenceLine: number
): { line: number; character: number } | undefined {
  const wordPattern = escapeRegExp(word);
  const declarationPatterns = [
    new RegExp(`^\\s*(?:const|var|type)\\s+${wordPattern}\\b`),
    new RegExp(`^\\s*func\\s+(?:\\([^)]*\\)\\s*)?${wordPattern}\\s*\\(`)
  ];
  let blockDeclaration: 'const' | 'var' | 'type' | undefined;

  for (let line = 0; line < document.lineCount; line++) {
    const text = document.lineAt(line).text;
    const trimmed = text.trim();

    if (line === referenceLine) {
      continue;
    }

    if (!blockDeclaration) {
      const blockStart = trimmed.match(/^(const|var|type)\s*\($/);
      if (blockStart) {
        blockDeclaration = blockStart[1] as 'const' | 'var' | 'type';
        continue;
      }
    } else if (trimmed === ')') {
      blockDeclaration = undefined;
      continue;
    }

    if (
      declarationPatterns.some((pattern) => pattern.test(text)) ||
      (blockDeclaration && new RegExp(`^\\s*${wordPattern}\\b`).test(text))
    ) {
      return {
        line,
        character: text.indexOf(word)
      };
    }
  }

  return undefined;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
