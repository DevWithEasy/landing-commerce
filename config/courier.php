<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Default Courier Driver
    |--------------------------------------------------------------------------
    |
    | This option controls the default courier driver used for dispatching
    | parcels and fetching delivery tracking updates.
    | Supported options: "mock", "steadfast", "pathao", "redx"
    |
    */

    'default' => env('COURIER_DEFAULT_DRIVER', 'mock'),

    /*
    |--------------------------------------------------------------------------
    | Courier Drivers Configuration
    |--------------------------------------------------------------------------
    |
    | Credentials and API endpoints for supported Bangladeshi delivery couriers.
    |
    */

    'drivers' => [

        'mock' => [
            'prefix' => env('COURIER_MOCK_PREFIX', 'MCK'),
        ],

        'steadfast' => [
            'api_key' => env('STEADFAST_API_KEY'),
            'secret_key' => env('STEADFAST_SECRET_KEY'),
            'base_url' => env('STEADFAST_BASE_URL', 'https://portal.steadfast.com.bd/api/v1'),
        ],

        'pathao' => [
            'client_id' => env('PATHAO_CLIENT_ID'),
            'client_secret' => env('PATHAO_CLIENT_SECRET'),
            'username' => env('PATHAO_USERNAME'),
            'password' => env('PATHAO_PASSWORD'),
            'store_id' => env('PATHAO_STORE_ID'),
            'base_url' => env('PATHAO_BASE_URL', 'https://api-hermes.pathao.com'),
        ],

        'redx' => [
            'api_token' => env('REDX_API_TOKEN'),
            'base_url' => env('REDX_BASE_URL', 'https://openapi.redx.com.bd/v1.0.0-sandbox'),
        ],

    ],

];
