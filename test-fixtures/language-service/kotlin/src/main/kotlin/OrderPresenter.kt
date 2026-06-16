package comment.doc.lens.kotlin

/** Formats the order status for customer-facing labels. */
fun formatStatus(status: String): String = status.uppercase()

/** Presents order data in views. */
class OrderPresenter {
    fun label(): String = formatStatus("paid")
}

