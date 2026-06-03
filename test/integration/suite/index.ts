import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import * as vscode from 'vscode';

const FIXTURE_ROOT = resolve(__dirname, '../../../../test/integration/fixtures/workspace');

export async function run(): Promise<void> {
  await activateCommentDocLens();

  await runTest('TypeScript reference shows definition documentation', async () => {
    const hints = await getHintsForFixture('order.ts');
    assertHintIncludes(hints, 'Paid order status.');
  });

  await runTest('JavaScript JSDoc shows definition documentation', async () => {
    const hints = await getHintsForFixture('order.js');
    assertHintIncludes(hints, 'Refunded order status.');
  });

  await runTest('TSX references show useful documentation without tag noise', async () => {
    const hints = await getHintsForFixture('view.tsx');
    assertHintIncludes(hints, 'Ready status shown in the badge.');
    assertNoHintIncludes(hints, 'StatusBadge component.');
  });

  await runTest('Go documentation shows when Go language support is available', async () => {
    const goExtension = vscode.extensions.getExtension('golang.go');
    const languages = await vscode.languages.getLanguages();
    if (!goExtension || !languages.includes('go') || !existsSync(resolve(FIXTURE_ROOT, 'order.go'))) {
      console.log('Skipping Go integration test: Go extension or language support is not available.');
      return;
    }

    await goExtension.activate();
    const hints = await getHintsForFixture('order.go');
    assertHintIncludes(hints, 'Paid order status in Go.');
  });
}

async function activateCommentDocLens(): Promise<void> {
  const extension = vscode.extensions.getExtension('local.comment-doc-lens');
  assert.ok(extension, 'Expected local.comment-doc-lens to be available in the extension host.');
  await extension.activate();
}

async function runTest(name: string, testBody: () => Promise<void>): Promise<void> {
  try {
    await testBody();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

async function getHintsForFixture(fileName: string): Promise<string[]> {
  const document = await vscode.workspace.openTextDocument(resolve(FIXTURE_ROOT, fileName));
  await vscode.window.showTextDocument(document);

  const range = new vscode.Range(
    0,
    0,
    document.lineCount - 1,
    document.lineAt(document.lineCount - 1).text.length
  );

  const hints = await retry(async () => {
    const result = await vscode.commands.executeCommand<vscode.InlayHint[]>(
      'vscode.executeInlayHintProvider',
      document.uri,
      range
    );
    return (result ?? []).map(labelToString);
  });

  return hints;
}

async function retry<T>(operation: () => Promise<T>): Promise<T> {
  let lastResult: T | undefined;
  for (let attempt = 0; attempt < 10; attempt++) {
    lastResult = await operation();
    if (Array.isArray(lastResult) && lastResult.length > 0) {
      return lastResult;
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 250));
  }

  return lastResult as T;
}

function labelToString(hint: vscode.InlayHint): string {
  if (typeof hint.label === 'string') {
    return hint.label;
  }

  return hint.label.map((part) => part.value).join('');
}

function assertHintIncludes(hints: readonly string[], expected: string): void {
  assert.ok(
    hints.some((hint) => hint.includes(expected)),
    `Expected one of ${JSON.stringify(hints)} to include ${JSON.stringify(expected)}`
  );
}

function assertNoHintIncludes(hints: readonly string[], unexpected: string): void {
  assert.ok(
    hints.every((hint) => !hint.includes(unexpected)),
    `Expected none of ${JSON.stringify(hints)} to include ${JSON.stringify(unexpected)}`
  );
}
