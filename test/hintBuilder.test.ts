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
        maxHintsPerRequest: 20,
        minIdentifierLength: 2,
        preferPropertyTail: true,
        dedupeLineHints: true,
        resolveTimeoutMs: 750
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
        maxHintsPerRequest: 20,
        minIdentifierLength: 2,
        preferPropertyTail: true,
        dedupeLineHints: true,
        resolveTimeoutMs: 750
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
        maxHintsPerRequest: 20,
        minIdentifierLength: 2,
        preferPropertyTail: true,
        dedupeLineHints: true,
        resolveTimeoutMs: 750
      },
      resolver
    }),
    []
  );
});

test('prefers the tail of property chains when configured', async () => {
  const resolvedWords: string[] = [];
  const resolver: CommentHintResolver = {
    resolve: async (candidate) => {
      resolvedWords.push(candidate.word);
      return {
        summary: `doc for ${candidate.word}`,
        fullText: `doc for ${candidate.word}`,
        location: { uri: 'file:///order.ts', line: 1, character: 1 }
      };
    }
  };

  const hints = await buildCommentHints({
    lines: ['const label = order.status.displayName;'],
    range: { startLine: 0, endLineInclusive: 0 },
    languageId: 'typescript',
    documentUri: 'file:///order.ts',
    documentVersion: 1,
    config: {
      enabled: true,
      languages: ['typescript'],
      maxHintsPerRequest: 20,
      minIdentifierLength: 2,
      preferPropertyTail: true,
      dedupeLineHints: true,
      resolveTimeoutMs: 750
    },
    resolver
  });

  assert.deepEqual(resolvedWords, ['displayName']);
  assert.deepEqual(hints.map((hint) => hint.label), ['// doc for displayName']);
});

test('applies max hint budget after filtering noisy candidates', async () => {
  const resolvedWords: string[] = [];
  const resolver: CommentHintResolver = {
    resolve: async (candidate) => {
      resolvedWords.push(candidate.word);
      return {
        summary: `doc for ${candidate.word}`,
        fullText: `doc for ${candidate.word}`,
        location: { uri: 'file:///order.ts', line: 1, character: 1 }
      };
    }
  };

  const hints = await buildCommentHints({
    lines: [
      'const ignoredDeclaration = order.customer.profile.displayName;',
      'const visible = usefulSymbol;'
    ],
    range: { startLine: 0, endLineInclusive: 1 },
    languageId: 'typescript',
    documentUri: 'file:///order.ts',
    documentVersion: 1,
    config: {
      enabled: true,
      languages: ['typescript'],
      maxHintsPerRequest: 2,
      minIdentifierLength: 2,
      preferPropertyTail: true,
      dedupeLineHints: true,
      resolveTimeoutMs: 750
    },
    resolver
  });

  assert.deepEqual(resolvedWords, ['displayName', 'usefulSymbol']);
  assert.deepEqual(hints.map((hint) => hint.label), ['// doc for displayName', '// doc for usefulSymbol']);
});

test('deduplicates repeated candidate positions within a request', async () => {
  let resolveCalls = 0;
  const resolver: CommentHintResolver = {
    resolve: async () => {
      resolveCalls++;
      return {
        summary: 'shared documentation',
        fullText: 'shared documentation'
      };
    }
  };

  const hints = await buildCommentHints({
    lines: ['const value = repeated + repeated;'],
    range: { startLine: 0, endLineInclusive: 0 },
    languageId: 'typescript',
    documentUri: 'file:///order.ts',
    documentVersion: 1,
    config: {
      enabled: true,
      languages: ['typescript'],
      maxHintsPerRequest: 20,
      minIdentifierLength: 2,
      preferPropertyTail: true,
      dedupeLineHints: true,
      resolveTimeoutMs: 750
    },
    resolver
  });

  assert.equal(resolveCalls, 2);
  assert.deepEqual(hints.map((hint) => hint.label), ['// shared documentation']);
});

test('filters short identifiers unless resolved documentation has a location', async () => {
  const resolver: CommentHintResolver = {
    resolve: async (candidate) => ({
      summary: `doc for ${candidate.word}`,
      fullText: `doc for ${candidate.word}`,
      location: candidate.word === 'b' ? { uri: 'file:///order.ts', line: 1, character: 1 } : undefined
    })
  };

  const hints = await buildCommentHints({
    lines: ['const a = b + total;'],
    range: { startLine: 0, endLineInclusive: 0 },
    languageId: 'typescript',
    documentUri: 'file:///order.ts',
    documentVersion: 1,
    config: {
      enabled: true,
      languages: ['typescript'],
      maxHintsPerRequest: 20,
      minIdentifierLength: 2,
      preferPropertyTail: true,
      dedupeLineHints: true,
      resolveTimeoutMs: 750
    },
    resolver
  });

  assert.deepEqual(hints.map((hint) => hint.label), ['// doc for b', '// doc for total']);
});

test('dedupes repeated line summaries and prefers a location-bearing hint', async () => {
  const resolver: CommentHintResolver = {
    resolve: async (candidate) => ({
      summary: '已支付订单',
      fullText: '已支付订单',
      location: candidate.word === 'paidAgain' ? { uri: 'file:///status.ts', line: 1, character: 1 } : undefined
    })
  };

  const hints = await buildCommentHints({
    lines: ['const label = paid + paidAgain;'],
    range: { startLine: 0, endLineInclusive: 0 },
    languageId: 'typescript',
    documentUri: 'file:///order.ts',
    documentVersion: 1,
    config: {
      enabled: true,
      languages: ['typescript'],
      maxHintsPerRequest: 20,
      minIdentifierLength: 2,
      preferPropertyTail: true,
      dedupeLineHints: true,
      resolveTimeoutMs: 750
    },
    resolver
  });

  assert.deepEqual(hints, [
    {
      line: 0,
      character: 30,
      label: '// 已支付订单',
      tooltip: '已支付订单',
      location: { uri: 'file:///status.ts', line: 1, character: 1 }
    }
  ]);
});

test('keeps repeated summaries when line dedupe is disabled', async () => {
  const resolver: CommentHintResolver = {
    resolve: async () => ({
      summary: '已支付订单',
      fullText: '已支付订单'
    })
  };

  const hints = await buildCommentHints({
    lines: ['const label = paid + paidAgain;'],
    range: { startLine: 0, endLineInclusive: 0 },
    languageId: 'typescript',
    documentUri: 'file:///order.ts',
    documentVersion: 1,
    config: {
      enabled: true,
      languages: ['typescript'],
      maxHintsPerRequest: 20,
      minIdentifierLength: 2,
      preferPropertyTail: true,
      dedupeLineHints: false,
      resolveTimeoutMs: 750
    },
    resolver
  });

  assert.deepEqual(hints.map((hint) => hint.label), ['// 已支付订单', '// 已支付订单']);
});

test('skips common declaration names and jsx tag names', async () => {
  const resolvedWords: string[] = [];
  const resolver: CommentHintResolver = {
    resolve: async (candidate) => {
      resolvedWords.push(candidate.word);
      return {
        summary: `doc for ${candidate.word}`,
        fullText: `doc for ${candidate.word}`
      };
    }
  };

  const hints = await buildCommentHints({
    lines: [
      'const ReadyStatus = "ready";',
      'function StatusBadge(props: { status: string }) { return <span>{props.status}</span>; }',
      'export const view = <StatusBadge status={ReadyStatus} />;'
    ],
    range: { startLine: 0, endLineInclusive: 2 },
    languageId: 'typescriptreact',
    documentUri: 'file:///view.tsx',
    documentVersion: 1,
    config: {
      enabled: true,
      languages: ['typescriptreact'],
      maxHintsPerRequest: 30,
      minIdentifierLength: 2,
      preferPropertyTail: true,
      dedupeLineHints: true,
      resolveTimeoutMs: 750
    },
    resolver
  });

  assert.equal(resolvedWords.includes('StatusBadge'), false);
  assert.equal(resolvedWords.includes('ReadyStatus'), true);
  assert.equal(hints.some((hint) => hint.label === '// doc for StatusBadge'), false);
  assert.equal(hints.some((hint) => hint.label === '// doc for ReadyStatus'), true);
});

test('limits concurrent resolver calls', async () => {
  let active = 0;
  let maxActive = 0;
  const resolver: CommentHintResolver = {
    resolve: async (candidate) => {
      active++;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active--;
      return {
        summary: `doc for ${candidate.word}`,
        fullText: `doc for ${candidate.word}`
      };
    }
  };

  await buildCommentHints({
    lines: ['const result = one + two + three + four + five + six;'],
    range: { startLine: 0, endLineInclusive: 0 },
    languageId: 'typescript',
    documentUri: 'file:///order.ts',
    documentVersion: 1,
    config: {
      enabled: true,
      languages: ['typescript'],
      maxHintsPerRequest: 20,
      minIdentifierLength: 2,
      preferPropertyTail: true,
      dedupeLineHints: false,
      resolveTimeoutMs: 750
    },
    resolver
  });

  assert.equal(maxActive, 4);
});

test('drops resolver results that exceed the configured timeout', async () => {
  const resolver: CommentHintResolver = {
    resolve: async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
      return {
        summary: 'late documentation',
        fullText: 'late documentation'
      };
    }
  };

  const hints = await buildCommentHints({
    lines: ['const label = status;'],
    range: { startLine: 0, endLineInclusive: 0 },
    languageId: 'typescript',
    documentUri: 'file:///order.ts',
    documentVersion: 1,
    config: {
      enabled: true,
      languages: ['typescript'],
      maxHintsPerRequest: 20,
      minIdentifierLength: 2,
      preferPropertyTail: true,
      dedupeLineHints: true,
      resolveTimeoutMs: 1
    },
    resolver
  });

  assert.deepEqual(hints, []);
});
