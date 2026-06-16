/// Formats the order status for customer-facing labels.
public func formatStatus(_ status: String) -> String {
    status.uppercased()
}

/// Presents order data in views.
public struct OrderPresenter {
    public init() {}

    public func label() -> String {
        formatStatus("paid")
    }
}

