import assert from 'node:assert/strict';
import test from 'node:test';
import { formatDocumentation } from '../src/documentationFormatter';

test('extracts the first useful markdown documentation line', () => {
  const result = formatDocumentation(
    ['```ts', 'const OrderStatusPaid: OrderStatus', '```', '已支付订单。', '用于展示支付成功后的订单。'],
    80
  );

  assert.equal(result?.summary, '已支付订单。');
  assert.equal(result?.fullText, '已支付订单。\n用于展示支付成功后的订单。');
});

test('strips common comment markers', () => {
  const result = formatDocumentation(['/**', ' * 已退款订单', ' */'], 80);

  assert.equal(result?.summary, '已退款订单');
  assert.equal(result?.fullText, '已退款订单');
});

test('truncates long summaries', () => {
  const result = formatDocumentation(['这是一个非常非常非常长的业务状态说明，用来解释订单在售后流程中的展示语义。'], 12);

  assert.equal(result?.summary, '这是一个非常非常非常长...');
});

test('returns undefined for signature-only content', () => {
  const result = formatDocumentation(['```go', 'const OrderStatusPaid OrderStatus = 1', '```'], 80);

  assert.equal(result, undefined);
});
