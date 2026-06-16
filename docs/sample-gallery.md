# Comment Doc Lens Sample Gallery

**Read existing docs where symbols are used.**

This gallery shows the intended reading experience across representative languages. Comment Doc Lens keeps source unchanged: it reads existing documentation from doc comments, docstrings, Javadoc, PHPDoc, XML docs, YARD/RDoc, KDoc, Swift documentation comments, Doxygen comments, or language-service hover output, then renders a short summary at the reference line.

## Before and After

| Before | After |
| --- | --- |
| ![VS Code before enabling Comment Doc Lens](../assets/demo-before.png) | ![VS Code after enabling Comment Doc Lens inline documentation hints](../assets/demo-after.png) |

## Go

```go
// Paid status from source comment.
const OrderStatusPaid OrderStatus = "paid"

func render(status OrderStatus) string {
    return FormatOrderStatus(OrderStatusPaid) // Paid status from source comment.
}
```

## TypeScript

```ts
/** Paid order status shown in order lists. */
export const OrderStatusPaid = 'paid';

const label = formatOrderStatus(OrderStatusPaid); // Paid order status shown in order lists.
```

## Python

```python
def format_status(status):
    """Format the order status for display."""
    return status

label = format_status("paid") # Format the order status for display.
```

## Java

```java
/** Formats the order status for display. */
String formatStatus(String status) {
  return status;
}

String label = formatStatus("paid"); // Formats the order status for display.
```

## Rust

```rust
/// Formats the order status.
pub fn format_status(status: &str) -> String {
    status.to_string()
}

let label = format_status("paid"); // Formats the order status.
```

## PHP

```php
/** Formats a PHP order status. */
function formatStatus(string $status): string {
    return $status;
}

$label = formatStatus(PAID_STATUS); // Formats a PHP order status.
```

## C#, Ruby, Kotlin, Swift, and C/C++

These languages are currently `experimental`: Comment Doc Lens uses language-service hover first and source fallback when it can identify a nearby XML docs, YARD/RDoc, KDoc, Swift doc comment, or Doxygen comment.

Use the reproducible workspaces under `test-fixtures/language-service/` when collecting screenshots for these languages. The current evidence gate, local environment snapshot, and capture checklist live in [Experimental language service evidence](language-service-evidence.md).

Use `Comment Doc Lens: Diagnose Workspace` when a language does not show hints, then copy the report with `Comment Doc Lens: Copy Diagnostics for Issue`.
