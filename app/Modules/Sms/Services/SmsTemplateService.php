<?php

declare(strict_types=1);

namespace App\Modules\Sms\Services;

use App\Modules\Orders\Models\Order;
use InvalidArgumentException;

class SmsTemplateService
{
    /**
     * @var array<string, string>
     */
    protected array $templates = [];

    /**
     * @param  array<string, string>  $customTemplates
     */
    public function __construct(array $customTemplates = [])
    {
        $this->templates = array_merge([
            'order_placed' => 'Dear {customer_name}, your order #{order_number} of BDT {total} has been placed successfully. Thank you for shopping with us!',
            'order_confirmed' => 'Dear {customer_name}, your order #{order_number} has been confirmed and is being prepared for fulfillment.',
            'out_for_delivery' => 'Dear {customer_name}, your order #{order_number} is out for delivery with {courier_name}. Tracking ID: {tracking_id}. Please keep BDT {total} ready for COD.',
        ], (array) config('sms.templates', []), $customTemplates);
    }

    /**
     * Get a registered template string by key.
     */
    public function getTemplate(string $key): ?string
    {
        return $this->templates[$key] ?? null;
    }

    /**
     * Set or override a template.
     */
    public function setTemplate(string $key, string $template): self
    {
        $this->templates[$key] = $template;

        return $this;
    }

    /**
     * List all registered template keys and their templates.
     *
     * @return array<string, string>
     */
    public function all(): array
    {
        return $this->templates;
    }

    /**
     * Render a template for a given Order with automatic placeholder interpolation.
     *
     * @param  array<string, string>  $extraPlaceholders
     */
    public function renderOrder(Order $order, string $templateOrKey, array $extraPlaceholders = []): string
    {
        $template = $this->getTemplate($templateOrKey) ?? $templateOrKey;

        if (empty($template)) {
            throw new InvalidArgumentException("SMS template [{$templateOrKey}] is not defined or is empty.");
        }

        $placeholders = array_merge([
            '{order_number}' => $order->order_number,
            '{customer_name}' => $order->customer_name,
            '{customer_phone}' => $order->customer_phone,
            '{total}' => number_format((float) $order->total, 2, '.', ''),
            '{subtotal}' => number_format((float) $order->subtotal, 2, '.', ''),
            '{shipping_fee}' => number_format((float) $order->shipping_fee, 2, '.', ''),
            '{courier_name}' => (string) ($order->courier_name ?: 'courier'),
            '{tracking_id}' => (string) ($order->courier_tracking_id ?: ''),
            '{tracking_url}' => (string) ($order->courier_tracking_url ?: ''),
        ], $extraPlaceholders);

        return $this->interpolate($template, $placeholders);
    }

    /**
     * Substitute key-value placeholders into a template string.
     *
     * @param  array<string, string>  $placeholders
     */
    public function interpolate(string $template, array $placeholders): string
    {
        $keys = [];
        $values = [];

        foreach ($placeholders as $key => $value) {
            $normalizedKey = str_starts_with($key, '{') && str_ends_with($key, '}')
                ? $key
                : '{'.$key.'}';

            $keys[] = $normalizedKey;
            $values[] = (string) $value;
        }

        return str_replace($keys, $values, $template);
    }
}
