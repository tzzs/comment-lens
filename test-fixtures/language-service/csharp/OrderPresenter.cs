namespace CommentDocLens.CSharp;

public static class OrderPresenter
{
    /// <summary>
    /// Formats the order status for customer-facing labels.
    /// </summary>
    public static string FormatStatus(string status)
    {
        return status.ToUpperInvariant();
    }

    public static string BuildLabel(string status)
    {
        return FormatStatus(status);
    }
}

