<?php

/** Paid order status in PHP. */
const PAID_STATUS = 'paid';

class OrderPresenter
{
    /** Label shown for paid orders. */
    private string $statusLabel = 'Paid';

    /** Formats a PHP order status. */
    public function formatStatus(string $status): string
    {
        return $status === PAID_STATUS ? $this->statusLabel : 'Unknown';
    }
}

$presenter = new OrderPresenter();
$label = $presenter->formatStatus(PAID_STATUS);
