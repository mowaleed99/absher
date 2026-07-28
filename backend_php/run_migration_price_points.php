<?php
require_once __DIR__ . '/config/db.php';
try {
    $conn->exec("ALTER TABLE `service_requests` ADD COLUMN IF NOT EXISTS `service_price_points` INT NOT NULL DEFAULT 0 AFTER `service_id`");
    echo "Successfully added service_price_points column to service_requests table.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
