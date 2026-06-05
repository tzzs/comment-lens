/** Paid order status constant. */
export const OrderStatusPaid = 'paid';

export enum OrderStatus {
  /** Refunded enum member. */
  Refunded = 'refunded'
}

/** Shared order metadata variable. */
export const orderMetadata = {
  label: 'Order'
};

/** Formats an order status label. */
export function formatOrderStatus(status: string): string {
  return status.toUpperCase();
}

/** Presents order values for display. */
export class OrderPresenter {
  /** Returns the display label for a status. */
  getDisplayLabel(status: string): string {
    return formatOrderStatus(status);
  }
}

/** Object helper for status labels. */
export const statusHelpers = {
  /** Formats through the object helper. */
  format(status: string): string {
    return formatOrderStatus(status);
  }
};

const currentStatus = OrderStatusPaid;
const refundedStatus = OrderStatus.Refunded;
const metadata = orderMetadata;
const formattedStatus = formatOrderStatus(currentStatus);
const presenter = new OrderPresenter();
const displayLabel = presenter.getDisplayLabel(refundedStatus);
const helperLabel = statusHelpers.format(displayLabel);

console.log(metadata, formattedStatus, helperLabel);
