/** Paid order status. */
export const OrderStatusPaid = 'paid';

export enum OrderStatus {
  /** Refunded enum member. */
  Refunded = 'refunded'
}

/** Formats the order status label. */
export function formatOrderStatus(status: string): string {
  return status.toUpperCase();
}

/** Order presenter class. */
export class OrderPresenter {
  /** Returns the display label. */
  getDisplayLabel(status: string): string {
    return formatOrderStatus(status);
  }
}

/** Shared order metadata. */
export const orderMetadata = {
  label: 'Order'
};

/** Object helper for status labels. */
export const statusHelpers = {
  /** Formats through the object helper. */
  format(status: string): string {
    return formatOrderStatus(status);
  }
};

const currentStatus = OrderStatusPaid;
const refundedStatus = OrderStatus.Refunded;
const formattedStatus = formatOrderStatus(currentStatus);
const presenter = new OrderPresenter();
const displayLabel = presenter.getDisplayLabel(refundedStatus);
const metadata = orderMetadata;
const metadataLabel = orderMetadata.label;
const helpers = statusHelpers;
const helperLabel = statusHelpers.format(displayLabel);
console.log(currentStatus);
console.log(formattedStatus, metadata, metadataLabel, helpers, helperLabel);
