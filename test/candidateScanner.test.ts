import assert from 'node:assert/strict';
import test from 'node:test';
import { scanCandidateSymbols } from '../src/candidateScanner';

test('scans identifiers in code and skips keywords', () => {
  const candidates = scanCandidateSymbols(
    ['const status = OrderStatusPaid;', 'if (status === OrderStatusRefunded) {}'],
    { startLine: 0, endLineInclusive: 1 },
    'typescript',
    20
  );

  assert.deepEqual(
    candidates.map((candidate) => candidate.word),
    ['status', 'OrderStatusPaid', 'status', 'OrderStatusRefunded']
  );
});

test('skips identifiers inside comments and strings', () => {
  const candidates = scanCandidateSymbols(
    [
      'const status = "OrderStatusPaid"; // OrderStatusRefunded',
      'const next = OrderStatusPending;'
    ],
    { startLine: 0, endLineInclusive: 1 },
    'typescript',
    20
  );

  assert.deepEqual(
    candidates.map((candidate) => candidate.word),
    ['status', 'next', 'OrderStatusPending']
  );
});

test('respects max candidate limit', () => {
  const candidates = scanCandidateSymbols(
    ['const a = one + two + three;'],
    { startLine: 0, endLineInclusive: 0 },
    'javascript',
    2
  );

  assert.deepEqual(candidates.map((candidate) => candidate.word), ['a', 'one']);
});
