<?php
// Production Database Migration Script for absher_georgia_db
require_once __DIR__ . '/../backend_php/config/db.php';

echo "========================================================\n";
echo "STARTING PRODUCTION DATABASE MIGRATION: absher_georgia_db\n";
echo "========================================================\n";

try {
    // 1. Create promo_codes table if not exists
    echo "\n--- 1. Creating Table: promo_codes ---\n";
    $conn->exec("
        CREATE TABLE IF NOT EXISTS promo_codes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            code VARCHAR(50) NOT NULL UNIQUE,
            discount_type ENUM('percentage', 'fixed', 'free') NOT NULL,
            discount_value DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            max_discount_points INT NULL,
            min_service_price_points INT NOT NULL DEFAULT 0,
            total_usage_limit INT NULL,
            per_student_limit INT NOT NULL DEFAULT 1,
            used_count INT NOT NULL DEFAULT 0,
            service_scope ENUM('all', 'selected') NOT NULL DEFAULT 'all',
            audience_scope ENUM('all', 'selected') NOT NULL DEFAULT 'all',
            start_at DATETIME NULL,
            expires_at DATETIME NULL,
            status ENUM('active', 'paused', 'expired', 'archived') NOT NULL DEFAULT 'active',
            campaign_name VARCHAR(255) NULL,
            created_by INT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_code (code),
            INDEX idx_status (status),
            INDEX idx_dates (start_at, expires_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
    echo "  [OK] promo_codes created or already exists.\n";

    // 2. Create promo_code_services table
    echo "\n--- 2. Creating Table: promo_code_services ---\n";
    $conn->exec("
        CREATE TABLE IF NOT EXISTS promo_code_services (
            id INT AUTO_INCREMENT PRIMARY KEY,
            promo_code_id INT NOT NULL,
            service_id INT NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_promo_service (promo_code_id, service_id),
            INDEX idx_service_id (service_id),
            CONSTRAINT fk_pcs_promo FOREIGN KEY (promo_code_id) REFERENCES promo_codes(id) ON DELETE CASCADE,
            CONSTRAINT fk_pcs_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
    echo "  [OK] promo_code_services created or already exists.\n";

    // 3. Create promo_code_students table
    echo "\n--- 3. Creating Table: promo_code_students ---\n";
    $conn->exec("
        CREATE TABLE IF NOT EXISTS promo_code_students (
            id INT AUTO_INCREMENT PRIMARY KEY,
            promo_code_id INT NOT NULL,
            student_id INT NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_promo_student (promo_code_id, student_id),
            INDEX idx_student_id (student_id),
            CONSTRAINT fk_pcst_promo FOREIGN KEY (promo_code_id) REFERENCES promo_codes(id) ON DELETE CASCADE,
            CONSTRAINT fk_pcst_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
    echo "  [OK] promo_code_students created or already exists.\n";

    // 4. Create promo_code_redemptions table
    echo "\n--- 4. Creating Table: promo_code_redemptions ---\n";
    $conn->exec("
        CREATE TABLE IF NOT EXISTS promo_code_redemptions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            promo_code_id INT NOT NULL,
            student_id INT NULL,
            service_request_id INT NULL,
            service_id INT NULL,
            code_snapshot VARCHAR(50) NOT NULL,
            discount_type_snapshot ENUM('percentage', 'fixed', 'free') NOT NULL,
            discount_value_snapshot DECIMAL(10,2) NOT NULL,
            original_price_points INT NOT NULL,
            discount_points INT NOT NULL,
            final_price_points INT NOT NULL,
            status ENUM('applied', 'reversed') NOT NULL DEFAULT 'applied',
            redeemed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            reversed_at DATETIME NULL,
            INDEX idx_promo_code_id (promo_code_id),
            INDEX idx_student_id (student_id),
            INDEX idx_service_request_id (service_request_id),
            INDEX idx_status (status),
            CONSTRAINT fk_pcr_promo FOREIGN KEY (promo_code_id) REFERENCES promo_codes(id) ON DELETE RESTRICT,
            CONSTRAINT fk_pcr_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL,
            CONSTRAINT fk_pcr_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL,
            CONSTRAINT fk_pcr_request FOREIGN KEY (service_request_id) REFERENCES service_requests(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
    echo "  [OK] promo_code_redemptions created or already exists.\n";

    // 5. Extend service_requests table
    echo "\n--- 5. Extending service_requests Table ---\n";
    $srCols = $conn->query("SHOW COLUMNS FROM service_requests")->fetchAll(PDO::FETCH_COLUMN);
    
    if (!in_array('promo_code_id', $srCols)) {
        $conn->exec("ALTER TABLE service_requests ADD COLUMN promo_code_id INT NULL AFTER service_id;");
        echo "  [OK] Added column promo_code_id to service_requests.\n";
    }
    if (!in_array('points_discount', $srCols)) {
        $conn->exec("ALTER TABLE service_requests ADD COLUMN points_discount INT NOT NULL DEFAULT 0;");
        echo "  [OK] Added column points_discount to service_requests.\n";
    }
    if (!in_array('cancellation_reason', $srCols)) {
        $conn->exec("ALTER TABLE service_requests ADD COLUMN cancellation_reason TEXT NULL;");
        echo "  [OK] Added column cancellation_reason to service_requests.\n";
    }
    if (!in_array('cancelled_at', $srCols)) {
        $conn->exec("ALTER TABLE service_requests ADD COLUMN cancelled_at DATETIME NULL;");
        echo "  [OK] Added column cancelled_at to service_requests.\n";
    }

    // Check if fk_service_requests_promo exists
    $fkCheck = $conn->query("
        SELECT CONSTRAINT_NAME 
        FROM information_schema.TABLE_CONSTRAINTS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'service_requests' 
          AND CONSTRAINT_NAME = 'fk_service_requests_promo'
    ")->fetchColumn();
    if (!$fkCheck) {
        $conn->exec("
            ALTER TABLE service_requests 
            ADD CONSTRAINT fk_service_requests_promo 
            FOREIGN KEY (promo_code_id) REFERENCES promo_codes(id) ON DELETE SET NULL;
        ");
        echo "  [OK] Added foreign key fk_service_requests_promo to service_requests.\n";
    }

    // 6. Upgrade wallet_transactions composite unique index
    echo "\n--- 6. Upgrading wallet_transactions Composite Unique Index ---\n";
    $idxCheck = $conn->query("
        SELECT INDEX_NAME 
        FROM information_schema.STATISTICS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'wallet_transactions' 
          AND INDEX_NAME = 'uq_request_tx_type'
    ")->fetchColumn();
    if (!$idxCheck) {
        $conn->exec("
            ALTER TABLE wallet_transactions 
            ADD UNIQUE KEY uq_request_tx_type (service_request_id, type);
        ");
        echo "  [OK] Added unique index uq_request_tx_type on wallet_transactions(service_request_id, type).\n";
    } else {
        echo "  [OK] Unique index uq_request_tx_type already exists.\n";
    }

    // 7. Verify housing_offers table and columns
    echo "\n--- 7. Verifying housing_offers Table ---\n";
    $hoCols = $conn->query("SHOW COLUMNS FROM housing_offers")->fetchAll(PDO::FETCH_COLUMN);
    $requiredHoCols = ['title_ar', 'title_en', 'description_ar', 'description_en', 'badge_text_ar', 'badge_text_en'];
    foreach ($requiredHoCols as $col) {
        if (!in_array($col, $hoCols)) {
            $conn->exec("ALTER TABLE housing_offers ADD COLUMN `$col` VARCHAR(255) NULL;");
            echo "  [OK] Added missing column $col to housing_offers.\n";
        }
    }
    echo "  [OK] housing_offers structure verified.\n";

    echo "\n========================================================\n";
    echo "PRODUCTION DATABASE MIGRATION COMPLETED SUCCESSFULLY!\n";
    echo "========================================================\n";

} catch (Exception $e) {
    echo "\n[ERROR] Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
