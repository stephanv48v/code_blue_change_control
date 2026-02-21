<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Microsoft Entra ID (Azure AD) SSO Configuration
    |--------------------------------------------------------------------------
    */
    'microsoft' => [
        'client_id' => env('MICROSOFT_CLIENT_ID'),
        'client_secret' => env('MICROSOFT_CLIENT_SECRET'),
        'redirect' => env('MICROSOFT_REDIRECT_URI'),
        'tenant' => env('MICROSOFT_TENANT_ID'),
        'auth_url' => env('MICROSOFT_AUTH_URL', 'https://login.microsoftonline.com/common'),
        'include_tenant_info' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | MSP Integrations
    |--------------------------------------------------------------------------
    */
    'connectwise' => [
        'base_url' => env('CONNECTWISE_BASE_URL'),
    ],

    'it_glue' => [
        'base_url' => env('IT_GLUE_BASE_URL'),
    ],

    'kaseya' => [
        'base_url' => env('KASEYA_BASE_URL'),
    ],

    'auvik' => [
        'base_url' => env('AUVIK_BASE_URL'),
    ],

];
