<?php
$envOrigins = getenv('ALLOWED_ORIGINS');
if ($envOrigins !== false && $envOrigins !== '') {
    $allowed_origins = array_map('trim', explode(',', $envOrigins));
} else {
    $allowed_origins = [
        'http://localhost',
        'https://localhost',
        'http://127.0.0.1',
        'https://127.0.0.1',
        // Flutter web dev server ports
        'http://localhost:8080',
        'http://localhost:8081',
        'http://localhost:3000',
        'http://127.0.0.1:8080',
        'http://127.0.0.1:8081',
        'http://127.0.0.1:3000',
    ];
}

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// In local development, accept any localhost / 127.0.0.1 origin regardless of port
$isLocalOrigin = preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/', $origin);

if (in_array($origin, $allowed_origins) || $isLocalOrigin) {
    header("Access-Control-Allow-Origin: $origin");
    header("Access-Control-Allow-Credentials: true");
}
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if (($_SERVER['REQUEST_METHOD'] ?? '') == 'OPTIONS') {
    http_response_code(200);
    exit();
}
