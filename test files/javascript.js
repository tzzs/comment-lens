/** Paid order status constant. */
export const OrderStatusPaid = 'paid';

/** Shared order metadata variable. */
export const orderMetadata = {
  label: 'Order'
};

/**
 * Formats an order status label.
 * @param {string} status
 * @returns {string}
 */
export function formatOrderStatus(status) {
  return status.toUpperCase();
}

/** Object helper for status labels. */
export const statusHelpers = {
  /**
   * Formats through the object helper.
   * @param {string} status
   * @returns {string}
   */
  format(status) {
    return formatOrderStatus(status);
  }
};

const currentStatus = OrderStatusPaid;
const metadata = orderMetadata;
const formattedStatus = formatOrderStatus(currentStatus);
const helperLabel = statusHelpers.format(formattedStatus);

console.log(metadata, helperLabel);
