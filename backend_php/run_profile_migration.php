<?php
// Enforce command-line execution only
if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    header('Content-Type: text/plain');
    echo "Forbidden: This script can only be run via CLI.\n";
    exit(1);
}

require_once __DIR__ . '/config/db.php';

try {
    echo "Running profile table migration...\n";

    // Check if column avatar_url already exists
    $checkQuery = $conn->query("SHOW COLUMNS FROM `students` LIKE 'avatar_url'");
    $columnExists = $checkQuery->fetch();

    if (!$columnExists) {
        $conn->exec("ALTER TABLE `students` ADD COLUMN `avatar_url` VARCHAR(255) DEFAULT NULL AFTER `university`");
        echo "Column 'avatar_url' successfully added to 'students' table.\n";
    } else {
        echo "Column 'avatar_url' already exists. Skipping addition.\n";
    }

    echo "Migration completed successfully.\n";
} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
?>
