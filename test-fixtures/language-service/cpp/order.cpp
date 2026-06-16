#include <string>

/** Formats the order status for customer-facing labels. */
std::string formatStatus(std::string status) {
  return status;
}

/// Presents order data in views.
class OrderPresenter {
 public:
  std::string label() {
    return formatStatus("paid");
  }
};

int main() {
  OrderPresenter presenter;
  return presenter.label().empty() ? 1 : 0;
}

