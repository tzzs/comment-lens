package main

import "fmt"

// OrderStatus is an order lifecycle status.
type OrderStatus string

const (
	// OrderStatusPaid means the order has been paid.
	OrderStatusPaid OrderStatus = "paid"
)

// OrderMetadata stores shared order display data.
type OrderMetadata struct {
	Label string
}

// FormatOrderStatus formats an order status label.
func FormatOrderStatus(status OrderStatus) string {
	return string(status)
}

// OrderPresenter presents order values for display.
type OrderPresenter struct{}

// DisplayLabel returns the display label for a status.
func (OrderPresenter) DisplayLabel(status OrderStatus) string {
	return FormatOrderStatus(status)
}

func main() {
	status := OrderStatusPaid
	metadata := OrderMetadata{Label: "Order"}
	presenter := OrderPresenter{}
	label := presenter.DisplayLabel(status)

	fmt.Println(metadata, label)
}
