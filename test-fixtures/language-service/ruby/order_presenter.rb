# Formats the order status for customer-facing labels.
# @param status [String]
# @return [String]
def render_label(status)
  status.upcase
end

# Presents order data in views.
class OrderPresenter
  def label
    render_label("paid")
  end
end

