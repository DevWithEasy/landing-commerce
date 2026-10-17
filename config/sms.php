<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Default SMS Driver
    |--------------------------------------------------------------------------
    |
    | Supported options: "mock", "greenweb", "ssl_wireless", "smspoh"
    |
    */

    'default' => env('SMS_DEFAULT_DRIVER', 'mock'),

    /*
    |--------------------------------------------------------------------------
    | SMS Drivers Configuration
    |--------------------------------------------------------------------------
    |
    | Credentials and API configurations for local Bangladeshi and regional SMS gateways.
    |
    */

    'drivers' => [

        'mock' => [
            'log_channel' => env('SMS_MOCK_LOG_CHANNEL', 'single'),
        ],

        'greenweb' => [
            'token' => env('GREENWEB_TOKEN'),
            'base_url' => env('GREENWEB_BASE_URL', 'https://api.greenweb.com.bd/api.php'),
        ],

        'ssl_wireless' => [
            'api_token' => env('SSL_WIRELESS_API_TOKEN'),
            'sid' => env('SSL_WIRELESS_SID'),
            'base_url' => env('SSL_WIRELESS_BASE_URL', 'https://smsplus.sslwireless.com/api/v3/send-sms'),
        ],

        'smspoh' => [
            'token' => env('SMSPOH_TOKEN'),
            'sender_id' => env('SMSPOH_SENDER_ID'),
            'base_url' => env('SMSPOH_BASE_URL', 'https://v3.smspoh.com/api/rest/send'),
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Customizable SMS Notification Templates
    |--------------------------------------------------------------------------
    |
    | Supported placeholders:
    | {order_number}, {customer_name}, {total}, {subtotal}, {shipping_fee},
    | {courier_name}, {tracking_id}, {tracking_url}
    |
    */

    'templates' => [
        'order_placed' => env(
            'SMS_TEMPLATE_ORDER_PLACED',
            'Dear {customer_name}, your order #{order_number} of BDT {total} has been placed successfully. Thank you for shopping with us!'
        ),
        'order_confirmed' => env(
            'SMS_TEMPLATE_ORDER_CONFIRMED',
            'Dear {customer_name}, your order #{order_number} has been confirmed and is being prepared for fulfillment.'
        ),
        'out_for_delivery' => env(
            'SMS_TEMPLATE_OUT_FOR_DELIVERY',
            'Dear {customer_name}, your order #{order_number} is out for delivery with {courier_name}. Tracking ID: {tracking_id}. Please keep BDT {total} ready for COD.'
        ),
    ],

];
