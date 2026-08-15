<?php
require_once __DIR__ . '/../backend_php/config/db.php';

echo "Updating blocked_identities table in production...\n";
$conn->exec("DROP TABLE IF EXISTS blocked_identities;");
$conn->exec("
    CREATE TABLE blocked_identities (
        id INT AUTO_INCREMENT PRIMARY KEY,
        identifier_type ENUM('email','phone') NOT NULL,
        identifier_value VARCHAR(255) NOT NULL,
        normalized_value VARCHAR(255) NOT NULL,
        source_student_id INT NULL,
        reason VARCHAR(255) NULL,
        created_by_admin VARCHAR(100) NULL,
        created_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_type (identifier_type),
        INDEX idx_norm (normalized_value),
        INDEX idx_std (source_student_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
");
echo "blocked_identities table schema updated successfully.\n";
