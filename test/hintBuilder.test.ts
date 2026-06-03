import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCommentHints, type CommentHintResolver } from '../src/hintBuilder';

test('builds inlay hints from resolved candidate documentation', async () => {
  const resolver: CommentHintResolver = {
    resolve: async (candidate) =>
      candidate.word.startsWith('OrderStatus')
        ? {
            summary: '已支付订单',
            fullText: '已支付订单\n用于订单列表展示',
            location: { uri: 'file:///status.ts', line: 1, character: 13 }
          }
        : undefined
  };

  const hints = await buildCommentHints({
    lines: ['const status = OrderStatusPaid;'],
    range: { startLine: 0, endLineInclusive: 0 },
    languageId: 'typescript',
    documentUri: 'file:///order.ts',
    documentVersion: 1,
    config: {
      enabled: true,
      languages: ['typescript'],
      maxHintsPerRequest: 20
    },
    resolver
  });

  assert.deepEqual(hints, [
    {
      line: 0,
      character: 30,
      label: '// 已支付订单',
      tooltip: '已支付订单\n用于订单列表展示',
      location: { uri: 'file:///status.ts', line: 1, character: 13 }
    }
  ]);
});

test('returns no hints when disabled or language is not enabled', async () => {
  const resolver: CommentHintResolver = {
    resolve: async () => {
      throw new Error('resolver should not be called');
    }
  };

  assert.deepEqual(
    await buildCommentHints({
      lines: ['const status = OrderStatusPaid;'],
      range: { startLine: 0, endLineInclusive: 0 },
      languageId: 'typescript',
      documentUri: 'file:///order.ts',
      documentVersion: 1,
      config: {
        enabled: false,
        languages: ['typescript'],
        maxHintsPerRequest: 20
      },
      resolver
    }),
    []
  );

  assert.deepEqual(
    await buildCommentHints({
      lines: ['const status = OrderStatusPaid;'],
      range: { startLine: 0, endLineInclusive: 0 },
      languageId: 'go',
      documentUri: 'file:///order.go',
      documentVersion: 1,
      config: {
        enabled: true,
        languages: ['typescript'],
        maxHintsPerRequest: 20
      },
      resolver
    }),
    []
  );
});
