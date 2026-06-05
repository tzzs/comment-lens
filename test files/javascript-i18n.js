/** Synchronizes customer-visible order fulfillment metadata before the checkout confirmation screen renders. */
export const EnglishFulfillmentSummary = 'fulfillment-ready';

/** 中文订单状态说明：用于在支付完成后展示给客服和运营人员的履约进度。 */
export const ChineseFulfillmentSummary = '履约准备完成';

/**
 * Bilingual status summary: 支付完成后用于确认订单已经进入履约队列。
 * @param {string} status
 * @returns {string}
 */
export function formatBilingualOrderStatus(status) {
  return status.toUpperCase();
}

const englishSummary = EnglishFulfillmentSummary;
const chineseSummary = ChineseFulfillmentSummary;
const bilingualSummary = formatBilingualOrderStatus(englishSummary);

console.log(englishSummary, chineseSummary, bilingualSummary);
