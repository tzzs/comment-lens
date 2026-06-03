import assert from 'node:assert/strict';
import test from 'node:test';
import { hoverContentsToMarkdownLines } from '../src/hoverContent';

test('extracts strings, markdown strings, and marked strings from hover contents', () => {
  const lines = hoverContentsToMarkdownLines([
    'plain doc',
    { value: 'markdown doc\nsecond line' },
    { language: 'go', value: 'const status OrderStatus' }
  ]);

  assert.deepEqual(lines, [
    'plain doc',
    'markdown doc',
    'second line',
    '```go',
    'const status OrderStatus',
    '```'
  ]);
});
