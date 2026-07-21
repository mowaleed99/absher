<?php
// Database Configuration (v2)
require_once __DIR__ . '/../api/core/env.php';
Env::load(__DIR__ . '/../.env');

require_once __DIR__ . '/../api/core/headers.php';
require_once __DIR__ . '/../api/core/response.php';

$host = Env::get('DB_HOST', '127.0.0.1');
$db_name = Env::get('DB_NAME', 'absher_georgia_db');
$username = Env::get('DB_USER', 'root');
$password = Env::get('DB_PASS', '');

// Application Configuration
define('JWT_SECRET', Env::get('JWT_SECRET', 'local_development_secret_12345'));

try {
    $conn = new PDO("mysql:host=" . $host . ";dbname=" . $db_name . ";charset=utf8mb4", $username, $password);
    
    // Security & Standards: Enable Exceptions and Disable Emulated Prepares
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $conn->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
    $conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

} catch(PDOException $exception) {
    error_log("Database connection error: " . $exception->getMessage());
    jsonResponse(false, "Database connection failed", 500);
    exit();
}
