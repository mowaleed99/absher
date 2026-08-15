<?php
require_once __DIR__ . '/../backend_php/api/core/env.php';
Env::load(__DIR__ . '/../backend_php/.env');

$host = Env::get('DB_HOST', '127.0.0.1');
$user = Env::get('DB_USER', 'root');
$pass = Env::get('DB_PASS', '');

$prodConn = new PDO("mysql:host=$host;dbname=absher_georgia_db;charset=utf8mb4", $user, $pass);
$stagingConn = new PDO("mysql:host=$host;dbname=absher_georgia_staging;charset=utf8mb4", $user, $pass);

echo "=====================================================\n";
echo "SCHEMA COMPARISON: STAGING VS PRODUCTION\n";
echo "=====================================================\n";

$tables = $stagingConn->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);

foreach ($tables as $table) {
    $stCols = $stagingConn->query("SHOW COLUMNS FROM `$table`")->fetchAll(PDO::FETCH_ASSOC);
    $stColMap = [];
    foreach ($stCols as $c) $stColMap[$c['Field']] = $c['Type'];

    $prTableCheck = $prodConn->query("SHOW TABLES LIKE '$table'")->fetch();
    if (!$prTableCheck) {
        echo "Table MISSING in Prod: $table\n";
        continue;
    }

    $prCols = $prodConn->query("SHOW COLUMNS FROM `$table`")->fetchAll(PDO::FETCH_ASSOC);
    $prColMap = [];
    foreach ($prCols as $c) $prColMap[$c['Field']] = $c['Type'];

    foreach ($stColMap as $col => $type) {
        if (!isset($prColMap[$col])) {
            echo "Column MISSING in Prod table '$table': $col ($type)\n";
        }
    }
}
echo "=====================================================\n";
