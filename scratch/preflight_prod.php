<?php
// Production Preflight Audit Script
require_once __DIR__ . '/../backend_php/config/db.php';

echo "=====================================================\n";
echo "PRODUCTION DATABASE & SCHEMA AUDIT: absher_georgia_db\n";
echo "=====================================================\n";

$tables = $conn->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
echo "Total Tables: " . count($tables) . "\n";
foreach ($tables as $t) {
    $count = $conn->query("SELECT COUNT(*) FROM `$t`")->fetchColumn();
    echo "  - $t ($count rows)\n";
}

echo "\n--- Checking Wallet Transactions for Potential Duplicate (service_request_id, type) ---\n";
$dupQuery = $conn->query("
    SELECT service_request_id, type, COUNT(*) as cnt 
    FROM wallet_transactions 
    WHERE service_request_id IS NOT NULL 
    GROUP BY service_request_id, type 
    HAVING cnt > 1
");
$dups = $dupQuery->fetchAll(PDO::FETCH_ASSOC);
if (empty($dups)) {
    echo "  [PASS] Zero duplicate (service_request_id, type) found in production wallet_transactions.\n";
} else {
    echo "  [ALERT] Found duplicate rows in wallet_transactions:\n";
    print_r($dups);
}

echo "\n--- Checking Housing Offers in Production ---\n";
if (in_array('housing_offers', $tables)) {
    $cols = $conn->query("SHOW COLUMNS FROM housing_offers")->fetchAll(PDO::FETCH_COLUMN);
    echo "  Columns in production housing_offers: " . implode(', ', $cols) . "\n";
    $hoCount = $conn->query("SELECT COUNT(*) FROM housing_offers")->fetchColumn();
    echo "  Existing housing_offers count: $hoCount\n";
} else {
    echo "  Table housing_offers does not exist in production.\n";
}

echo "\n--- Checking Promo Codes in Production ---\n";
$promoTables = ['promo_codes', 'promo_code_services', 'promo_code_students', 'promo_code_redemptions'];
foreach ($promoTables as $pt) {
    echo "  - $pt: " . (in_array($pt, $tables) ? "EXISTS" : "NOT PRESENT") . "\n";
}

echo "=====================================================\n";
