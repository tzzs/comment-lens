package main

// Paid order status in Go.
const OrderStatusPaid = "paid"

// Refunded order status in Go.
const OrderStatusRefunded = "refunded"

// FormatOrderStatus formats an order status in Go.
func FormatOrderStatus(status string) string {
	return status
}

// OrderPresenter presents order values in Go.
type OrderPresenter struct{}

// DisplayLabel returns the display label in Go.
func (OrderPresenter) DisplayLabel(status string) string {
	return FormatOrderStatus(status)
}

func main() {
	status := OrderStatusPaid
	presenter := OrderPresenter{}
	label := presenter.DisplayLabel(status)
	switch status {
	case OrderStatusRefunded:
		_ = FormatOrderStatus(label)
	}
}
