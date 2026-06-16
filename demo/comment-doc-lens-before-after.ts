/**
 * Paid order status shown after checkout capture succeeds.
 */
export const EnglishPaidStatus = 'paid';

/**
 * Refunded order status shown after money is returned to the customer.
 */
export const EnglishRefundedStatus = 'refunded';

/**
 * Formats the short customer-facing order status label.
 * @param status Raw status id from the checkout service.
 * @returns Label shown in the order timeline.
 */
export function formatEnglishOrderStatus(status: string): string {
  if (status === EnglishPaidStatus) {
    return 'Paid';
  }

  if (status === EnglishRefundedStatus) {
    return 'Refunded';
  }

  return 'Pending review';
}

/**
 * Builds the customer email subject for an order status update.
 * @param status Raw status id from the checkout service.
 * @returns Subject line used by transactional email.
 */
export function buildEnglishCustomerEmail(status: string): string {
  return `Your order is ${formatEnglishOrderStatus(status).toLowerCase()}`;
}

/**
 * Presenter used by support agents when scanning order history.
 */
export class EnglishOrderPresenter {
  /**
   * Returns the compact badge text used in the support dashboard.
   */
  getBadgeText(status: string): string {
    return `[${formatEnglishOrderStatus(status)}]`;
  }
}



/**
 * 支付成功后展示给用户的订单状态。
 */
export const ChinesePaidStatus = '已支付';

/**
 * 售后退款完成后展示给用户的订单状态。
 */
export const ChineseRefundedStatus = '已退款';

/**
 * 格式化用户可见的订单状态短标签。
 * @param status 来自订单服务的原始状态。
 * @returns 展示在订单时间线中的状态文案。
 */
export function formatChineseOrderStatus(status: string): string {
  if (status === ChinesePaidStatus) {
    return '已支付';
  }

  if (status === ChineseRefundedStatus) {
    return '已退款';
  }

  return '待人工确认';
}

/**
 * 生成订单状态变更时发送给用户的短信内容。
 * @param status 来自订单服务的原始状态。
 * @returns 发送给用户的短信正文。
 */
export function buildChineseStatusMessage(status: string): string {
  return `您的订单状态已更新为：${formatChineseOrderStatus(status)}`;
}

/**
 * 客服查看订单历史时使用的展示器。
 */
export class ChineseOrderPresenter {
  /**
   * 返回客服后台列表里使用的紧凑徽标文案。
   */
  getBadgeText(status: string): string {
    return `【${formatChineseOrderStatus(status)}】`;
  }
}

/**
 * 创建订单运营看板中的中文状态行。
 * @param statuses 订单服务返回的状态列表。
 * @returns 运营看板中展示的状态行。
 */
export function createChineseDashboardRows(statuses: readonly string[]): string[] {
  return statuses.map((status) => formatChineseOrderStatus(status));
}

/**
 * Creates dashboard rows for the order operations screen.
 * @param statuses Status values returned from the order service.
 * @returns Rows shown in the operations dashboard.
 */
export function createEnglishDashboardRows(statuses: readonly string[]): string[] {
  return statuses.map((status) => formatEnglishOrderStatus(status));
}

const englishPaidStatus = EnglishPaidStatus;
const englishRefundedStatus = EnglishRefundedStatus;
const englishFormatter = formatEnglishOrderStatus;
const englishEmailBuilder = buildEnglishCustomerEmail;
const englishPresenter = EnglishOrderPresenter;
const englishDashboardRows = createEnglishDashboardRows;

const chinesePaidStatus = ChinesePaidStatus;
const chineseRefundedStatus = ChineseRefundedStatus;
const chineseFormatter = formatChineseOrderStatus;
const chineseMessageBuilder = buildChineseStatusMessage;
const chinesePresenter = ChineseOrderPresenter;
const chineseDashboardRows = createChineseDashboardRows;

console.log(
  englishPaidStatus,
  englishRefundedStatus,
  englishFormatter,
  englishEmailBuilder,
  englishPresenter,
  englishDashboardRows,
  chinesePaidStatus,
  chineseRefundedStatus,
  chineseFormatter,
  chineseMessageBuilder,
  chinesePresenter,
  chineseDashboardRows
);
