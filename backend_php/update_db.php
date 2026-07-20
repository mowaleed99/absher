<?php
require_once __DIR__ . '/config/db.php';

try {
    // Add points column if not exists
    $conn->exec("ALTER TABLE `students` ADD COLUMN IF NOT EXISTS `points` INT(11) DEFAULT 0 AFTER `password`");
    echo "Added points column.\n";

    // Create wallet_transactions
    $conn->exec("CREATE TABLE IF NOT EXISTS `wallet_transactions` (
      `id` int(11) NOT NULL AUTO_INCREMENT,
      `student_id` int(11) NOT NULL,
      `amount` int(11) NOT NULL,
      `type` varchar(50) NOT NULL,
      `description` text NOT NULL,
      `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");
    echo "Created wallet_transactions table.\n";

    // Create notifications
    $conn->exec("CREATE TABLE IF NOT EXISTS `notifications` (
      `id` int(11) NOT NULL AUTO_INCREMENT,
      `student_id` int(11) NOT NULL,
      `title` varchar(255) NOT NULL,
      `body` text NOT NULL,
      `is_read` tinyint(1) DEFAULT 0,
      `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");
    echo "Created notifications table.\n";

    echo "Update complete.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
