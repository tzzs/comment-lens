import assert from 'node:assert/strict';
import test from 'node:test';
import type { SymbolCandidate } from '../src/candidateScanner';
import {
  csharpLanguageAdapter,
  goLanguageAdapter,
  javaLanguageAdapter,
  pythonLanguageAdapter,
  rustLanguageAdapter,
  typescriptFamilyLanguageAdapter
} from '../src/languages/languageRegistry';

test('go adapter owns declaration filtering and source comment fallback behavior', () => {
  assert.equal(goLanguageAdapter.resolveTimeoutMs, 2500);
  assert.equal(goLanguageAdapter.isDeclarationCandidate?.(candidate('FormatOrderStatus', 5), 'func FormatOrderStatus(status OrderStatus) string {'), true);
  assert.equal(goLanguageAdapter.isDeclarationCandidate?.(candidate('status', 2), '  status := OrderStatusPaid'), true);
  assert.equal(goLanguageAdapter.isDeclarationCandidate?.(candidate('OrderStatusPaid', 7), 'case OrderStatusPaid:'), false);

  assert.equal(goLanguageAdapter.sourceComment?.canRead({ uri: 'file:///order.go', line: 3, character: 0 }), true);
  assert.equal(goLanguageAdapter.sourceComment?.canRead({ uri: 'file:///order.ts', line: 3, character: 0 }), false);
});

test('typescript-family adapter owns declaration and jsx noise filtering behavior', () => {
  assert.equal(typescriptFamilyLanguageAdapter.isDeclarationCandidate?.(candidate('OrderStatus', 6), 'const OrderStatus = value;'), true);
  assert.equal(typescriptFamilyLanguageAdapter.isDeclarationCandidate?.(candidate('label', 6), 'const label = order.status;'), true);
  assert.equal(typescriptFamilyLanguageAdapter.isDeclarationCandidate?.(candidate('paid', 5), 'case paid:'), false);
  assert.equal(typescriptFamilyLanguageAdapter.isNoisyCandidate?.(candidate('StatusBadge', 1), '<StatusBadge status={status} />'), true);
  assert.equal(typescriptFamilyLanguageAdapter.isNoisyCandidate?.(candidate('status', 13), '<StatusBadge status={status} />'), true);
});

test('python adapter owns declaration filtering and docstring fallback behavior', () => {
  assert.equal(pythonLanguageAdapter.supportLevel, 'experimental');
  assert.equal(pythonLanguageAdapter.isDeclarationCandidate?.(candidate('format_status', 4), 'def format_status(status):'), true);
  assert.equal(pythonLanguageAdapter.isDeclarationCandidate?.(candidate('OrderPresenter', 6), 'class OrderPresenter:'), true);
  assert.equal(pythonLanguageAdapter.sourceComment?.canRead({ uri: 'file:///order.py', line: 0, character: 0 }), true);
  assert.equal(pythonLanguageAdapter.sourceComment?.canRead({ uri: 'file:///order.ts', line: 0, character: 0 }), false);

  const document = lines([
    'def format_status(status):',
    '    """Format the order status for display.',
    '    Used by list views.',
    '    """',
    '    return status',
    '',
    'class OrderPresenter:',
    "    '''Builds order labels.'''",
    '    pass'
  ]);

  assert.equal(pythonLanguageAdapter.sourceComment?.findDefinitionLine?.(document, candidate('format_status', 8, 8), {
    uri: 'file:///order.py',
    line: 8,
    character: 0
  }), 0);
  assert.deepEqual(pythonLanguageAdapter.sourceComment?.collectLeadingComments(document, 0), [
    'Format the order status for display.',
    'Used by list views.',
  ]);
  assert.deepEqual(pythonLanguageAdapter.sourceComment?.collectLeadingComments(document, 6), [
    'Builds order labels.'
  ]);
});

test('java adapter owns declaration filtering and javadoc fallback behavior', () => {
  assert.equal(javaLanguageAdapter.supportLevel, 'experimental');
  assert.equal(javaLanguageAdapter.isDeclarationCandidate?.(candidate('OrderPresenter', 13), 'public class OrderPresenter {'), true);
  assert.equal(javaLanguageAdapter.isDeclarationCandidate?.(candidate('formatStatus', 16), '  public String formatStatus(String status) {'), true);
  assert.equal(javaLanguageAdapter.sourceComment?.canRead({ uri: 'file:///OrderPresenter.java', line: 0, character: 0 }), true);
  assert.equal(javaLanguageAdapter.sourceComment?.canRead({ uri: 'file:///order.py', line: 0, character: 0 }), false);

  const document = lines([
    '/**',
    ' * Presents order data.',
    ' */',
    'public class OrderPresenter {',
    '  /** Format the order status. */',
    '  public String formatStatus(String status) {',
    '    return status;',
    '  }',
    '}'
  ]);

  assert.equal(javaLanguageAdapter.sourceComment?.findDefinitionLine?.(document, candidate('formatStatus', 19, 6), {
    uri: 'file:///OrderPresenter.java',
    line: 6,
    character: 0
  }), 5);
  assert.deepEqual(javaLanguageAdapter.sourceComment?.collectLeadingComments(document, 3), [
    '/**',
    '* Presents order data.',
    '*/'
  ]);
  assert.deepEqual(javaLanguageAdapter.sourceComment?.collectLeadingComments(document, 5), [
    '/** Format the order status. */'
  ]);
});

test('rust adapter owns declaration filtering and doc comment fallback behavior', () => {
  assert.equal(rustLanguageAdapter.supportLevel, 'experimental');
  assert.equal(rustLanguageAdapter.isDeclarationCandidate?.(candidate('format_status', 7), 'pub fn format_status(status: &str) -> String {'), true);
  assert.equal(rustLanguageAdapter.isDeclarationCandidate?.(candidate('OrderPresenter', 11), 'pub struct OrderPresenter;'), true);
  assert.equal(rustLanguageAdapter.sourceComment?.canRead({ uri: 'file:///order.rs', line: 0, character: 0 }), true);
  assert.equal(rustLanguageAdapter.sourceComment?.canRead({ uri: 'file:///OrderPresenter.java', line: 0, character: 0 }), false);

  const document = lines([
    '/// Formats the order status.',
    '/// Used by list views.',
    'pub fn format_status(status: &str) -> String {',
    '    status.to_string()',
    '}',
    '',
    'pub enum OrderStatus {',
    '    /// Paid order status.',
    '    Paid,',
    '}'
  ]);

  assert.equal(rustLanguageAdapter.sourceComment?.findDefinitionLine?.(document, candidate('Paid', 4, 9), {
    uri: 'file:///order.rs',
    line: 9,
    character: 0
  }), 8);
  assert.deepEqual(rustLanguageAdapter.sourceComment?.collectLeadingComments(document, 2), [
    '/// Formats the order status.',
    '/// Used by list views.'
  ]);
  assert.deepEqual(rustLanguageAdapter.sourceComment?.collectLeadingComments(document, 8), [
    '/// Paid order status.'
  ]);
});

test('csharp adapter is hover-only and does not enable source fallback yet', () => {
  assert.equal(csharpLanguageAdapter.supportLevel, 'hover-only');
  assert.deepEqual(csharpLanguageAdapter.languageIds, ['csharp']);
  assert.equal(csharpLanguageAdapter.sourceComment, undefined);
});

function candidate(word: string, startCharacter: number, line = 0): SymbolCandidate {
  return {
    word,
    line,
    startCharacter,
    endCharacter: startCharacter + word.length
  };
}

function lines(values: readonly string[]) {
  return {
    lineCount: values.length,
    lineAt(line: number) {
      return { text: values[line] ?? '' };
    }
  };
}
