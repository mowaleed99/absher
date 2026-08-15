<?php
// Production Full Schema Sync Script for absher_georgia_db
require_once __DIR__ . '/../backend_php/config/db.php';

echo "========================================================\n";
echo "SYNCING ALL COMPATIBLE SCHEMA CHANGES TO absher_georgia_db\n";
echo "========================================================\n";

try {
    // 1. Table: blocked_identities
    $conn->exec("
        CREATE TABLE IF NOT EXISTS blocked_identities (
            id INT AUTO_INCREMENT PRIMARY KEY,
            type ENUM('email', 'phone', 'ip', 'device_uuid') NOT NULL,
            value VARCHAR(255) NOT NULL,
            reason TEXT NULL,
            created_by INT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_type_value (type, value),
            INDEX idx_type (type)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
    echo "  [OK] Table blocked_identities verified.\n";

    // 2. notifications table
    $notifCols = $conn->query("SHOW COLUMNS FROM notifications")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('title_ar', $notifCols)) $conn->exec("ALTER TABLE notifications ADD COLUMN title_ar VARCHAR(255) NULL;");
    if (!in_array('title_en', $notifCols)) $conn->exec("ALTER TABLE notifications ADD COLUMN title_en VARCHAR(255) NULL;");
    if (!in_array('body_ar', $notifCols)) $conn->exec("ALTER TABLE notifications ADD COLUMN body_ar TEXT NULL;");
    if (!in_array('body_en', $notifCols)) $conn->exec("ALTER TABLE notifications ADD COLUMN body_en TEXT NULL;");
    echo "  [OK] Table notifications columns verified.\n";

    // 3. students table
    $stdCols = $conn->query("SHOW COLUMNS FROM students")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('nationality', $stdCols)) $conn->exec("ALTER TABLE students ADD COLUMN nationality VARCHAR(100) NULL;");
    if (!in_array('admin_status', $stdCols)) $conn->exec("ALTER TABLE students ADD COLUMN admin_status VARCHAR(100) NULL;");
    if (!in_array('admin_note', $stdCols)) $conn->exec("ALTER TABLE students ADD COLUMN admin_note TEXT NULL;");
    if (!in_array('is_blocked', $stdCols)) $conn->exec("ALTER TABLE students ADD COLUMN is_blocked TINYINT(1) NOT NULL DEFAULT 0;");
    echo "  [OK] Table students columns verified.\n";

    // 4. service_requests table
    $srCols = $conn->query("SHOW COLUMNS FROM service_requests")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('discount_points', $srCols)) $conn->exec("ALTER TABLE service_requests ADD COLUMN discount_points INT NOT NULL DEFAULT 0;");
    if (!in_array('final_price_points', $srCols)) $conn->exec("ALTER TABLE service_requests ADD COLUMN final_price_points INT NOT NULL DEFAULT 0;");
    if (!in_array('cancelled_by_admin_id', $srCols)) $conn->exec("ALTER TABLE service_requests ADD COLUMN cancelled_by_admin_id INT NULL;");
    if (!in_array('refund_status', $srCols)) $conn->exec("ALTER TABLE service_requests ADD COLUMN refund_status ENUM('none','refunded','not_applicable') DEFAULT 'none';");
    echo "  [OK] Table service_requests columns verified.\n";

    // 5. promo_code_redemptions table
    $pcrCols = $conn->query("SHOW COLUMNS FROM promo_code_redemptions")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('request_id_snapshot', $pcrCols)) $conn->exec("ALTER TABLE promo_code_redemptions ADD COLUMN request_id_snapshot INT NULL;");
    if (!in_array('student_name_snapshot', $pcrCols)) $conn->exec("ALTER TABLE promo_code_redemptions ADD COLUMN student_name_snapshot VARCHAR(150) NULL;");
    if (!in_array('student_phone_snapshot', $pcrCols)) $conn->exec("ALTER TABLE promo_code_redemptions ADD COLUMN student_phone_snapshot VARCHAR(50) NULL;");
    if (!in_array('student_email_snapshot', $pcrCols)) $conn->exec("ALTER TABLE promo_code_redemptions ADD COLUMN student_email_snapshot VARCHAR(150) NULL;");
    if (!in_array('service_title_snapshot', $pcrCols)) $conn->exec("ALTER TABLE promo_code_redemptions ADD COLUMN service_title_snapshot VARCHAR(200) NULL;");
    if (!in_array('campaign_snapshot', $pcrCols)) $conn->exec("ALTER TABLE promo_code_redemptions ADD COLUMN campaign_snapshot VARCHAR(255) NULL;");
    if (!in_array('payment_method', $pcrCols)) $conn->exec("ALTER TABLE promo_code_redemptions ADD COLUMN payment_method VARCHAR(30) DEFAULT 'wallet';");
    if (!in_array('reversed_reason', $pcrCols)) $conn->exec("ALTER TABLE promo_code_redemptions ADD COLUMN reversed_reason VARCHAR(255) NULL;");
    if (!in_array('created_at', $pcrCols)) $conn->exec("ALTER TABLE promo_code_redemptions ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;");
    echo "  [OK] Table promo_code_redemptions columns verified.\n";

    echo "\n========================================================\n";
    echo "SCHEMA SYNC TO absher_georgia_db COMPLETED SUCCESSFULLY!\n";
    echo "========================================================\n";

} catch (Exception $e) {
    echo "\n[ERROR] Schema sync failed: " . $e->getMessage() . "\n";
    exit(1);
}
