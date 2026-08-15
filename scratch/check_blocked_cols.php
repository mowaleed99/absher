<?php
require_once __DIR__ . '/../backend_php/api/core/env.php';
Env::load(__DIR__ . '/../backend_php/.env');

$host = Env::get('DB_HOST', '127.0.0.1');
$user = Env::get('DB_USER', 'root');
$pass = Env::get('DB_PASS', '');

$prodConn = new PDO("mysql:host=$host;dbname=absher_georgia_db;charset=utf8mb4", $user, $pass);
$stagingConn = new PDO("mysql:host=$host;dbname=absher_georgia_staging;charset=utf8mb4", $user, $pass);

echo "Staging blocked_identities columns:\n";
print_r($stagingConn->query("SHOW COLUMNS FROM blocked_identities")->fetchAll(PDO::FETCH_ASSOC));

echo "Production blocked_identities columns:\n";
print_r($prodConn->query("SHOW COLUMNS FROM blocked_identities")->fetchAll(PDO::FETCH_ASSOC));
