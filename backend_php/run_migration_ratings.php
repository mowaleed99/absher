<?php
// Enforce command-line execution or allow dashboard migration later
if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    header('Content-Type: text/plain');
    echo "Forbidden: This script can only be run via CLI.\n";
    exit(1);
}

require_once __DIR__ . '/config/db.php';

try {
    echo "Starting Ratings & Feedback System Migration...\n";

    // 1. Check if legacy reviews table exists
    $stmt = $conn->query("SHOW TABLES LIKE 'reviews'");
    $legacyTableExists = $stmt->fetchColumn() !== false;

    // Check if new service_reviews table already exists
    $stmt = $conn->query("SHOW TABLES LIKE 'service_reviews'");
    $newTableExists = $stmt->fetchColumn() !== false;

    if ($legacyTableExists && !$newTableExists) {
        echo "Found legacy 'reviews' table. Renaming and migrating...\n";

        // Rename table to service_reviews
        $conn->exec("RENAME TABLE `reviews` TO `service_reviews`");
        echo "Table renamed from 'reviews' to 'service_reviews'.\n";
        $newTableExists = true;
    }

    if ($newTableExists) {
        echo "Adding columns, indexes, and constraints to 'service_reviews'...\n";

        // Check columns and add them if they don't exist
        $columnsToAdd = [
            'student_id' => "INT DEFAULT NULL AFTER `id`",
            'service_request_id' => "INT DEFAULT NULL AFTER `student_id`",
            'status' => "ENUM('pending', 'approved', 'rejected') DEFAULT 'approved' AFTER `comment`", // approved by default for legacy
            'reviewed_by_admin_id' => "INT DEFAULT NULL AFTER `status`",
            'reviewed_at' => "DATETIME DEFAULT NULL AFTER `reviewed_by_admin_id`",
            'updated_at' => "DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`"
        ];

        foreach ($columnsToAdd as $colName => $colDef) {
            $checkCol = $conn->query("SHOW COLUMNS FROM `service_reviews` LIKE '$colName'")->fetch();
            if (!$checkCol) {
                $conn->exec("ALTER TABLE `service_reviews` ADD COLUMN `$colName` $colDef");
                echo "Added column '$colName' to 'service_reviews'.\n";
            } else {
                echo "Column '$colName' already exists in 'service_reviews'.\n";
            }
        }

        // Add constraints & indexes if they don't exist
        // Check foreign key: fk_service_reviews_student
        try {
            $conn->exec("ALTER TABLE `service_reviews` ADD CONSTRAINT `fk_service_reviews_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE");
            echo "Added foreign key constraint 'fk_service_reviews_student'.\n";
        } catch (PDOException $e) {
            echo "Foreign key constraint 'fk_service_reviews_student' already exists or skipped: " . $e->getMessage() . "\n";
        }

        // Check foreign key: fk_service_reviews_request
        try {
            $conn->exec("ALTER TABLE `service_reviews` ADD CONSTRAINT `fk_service_reviews_request` FOREIGN KEY (`service_request_id`) REFERENCES `service_requests` (`id`) ON DELETE SET NULL ON UPDATE CASCADE");
            echo "Added foreign key constraint 'fk_service_reviews_request'.\n";
        } catch (PDOException $e) {
            echo "Foreign key constraint 'fk_service_reviews_request' already exists or skipped: " . $e->getMessage() . "\n";
        }

        // Add unique index for student and request (prevents double reviews)
        try {
            $conn->exec("ALTER TABLE `service_reviews` ADD UNIQUE KEY `uq_student_service_request` (`student_id`, `service_request_id`)");
            echo "Added unique constraint on (student_id, service_request_id).\n";
        } catch (PDOException $e) {
            echo "Unique constraint 'uq_student_service_request' already exists or skipped.\n";
        }

        // Add performance indexes
        try {
            $conn->exec("ALTER TABLE `service_reviews` ADD INDEX `idx_service_reviews_status` (`status`)");
            echo "Added index for status.\n";
        } catch (PDOException $e) {}

        try {
            $conn->exec("ALTER TABLE `service_reviews` ADD INDEX `idx_service_reviews_rating` (`rating`)");
            echo "Added index for rating.\n";
        } catch (PDOException $e) {}

        // Data migration: Link legacy reviews to students where names match
        echo "Mapping legacy reviews to student IDs where student names match...\n";
        $mappedCount = $conn->exec("
            UPDATE `service_reviews` r
            JOIN `students` s ON r.student_name = s.full_name
            SET r.student_id = s.id
            WHERE r.student_id IS NULL
        ");
        echo "Mapped $mappedCount legacy reviews to student accounts.\n";

    } else {
        // Fallback: Neither legacy 'reviews' nor 'service_reviews' exist - create table from scratch
        echo "Creating 'service_reviews' table from scratch...\n";
        $conn->exec("CREATE TABLE IF NOT EXISTS `service_reviews` (
          `id` INT AUTO_INCREMENT PRIMARY KEY,
          `student_id` INT NOT NULL,
          `service_request_id` INT DEFAULT NULL,
          `student_name` VARCHAR(150) DEFAULT NULL,
          `uni` VARCHAR(150) DEFAULT NULL,
          `rating` INT NOT NULL CHECK (`rating` BETWEEN 1 AND 5),
          `comment` TEXT DEFAULT NULL,
          `status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
          `reviewed_by_admin_id` INT DEFAULT NULL,
          `reviewed_at` DATETIME DEFAULT NULL,
          `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
          `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          CONSTRAINT `fk_service_reviews_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT `fk_service_reviews_request` FOREIGN KEY (`service_request_id`) REFERENCES `service_requests` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
          UNIQUE KEY `uq_student_service_request` (`student_id`, `service_request_id`),
          INDEX `idx_service_reviews_status` (`status`),
          INDEX `idx_service_reviews_rating` (`rating`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        echo "Table 'service_reviews' created successfully.\n";
    }

    // 2. Create Application Feedback Table
    echo "Checking/creating 'application_feedback' table...\n";
    $conn->exec("CREATE TABLE IF NOT EXISTS `application_feedback` (
      `id` INT AUTO_INCREMENT PRIMARY KEY,
      `student_id` INT NOT NULL,
      `feedback_type` ENUM('suggestion', 'bug', 'ux', 'feature') NOT NULL,
      `comment` TEXT NOT NULL,
      `status` ENUM('pending', 'reviewed', 'resolved') DEFAULT 'pending',
      `reviewed_by_admin_id` INT DEFAULT NULL,
      `reviewed_at` DATETIME DEFAULT NULL,
      `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
      `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT `fk_app_feedback_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
      INDEX `idx_app_feedback_type` (`feedback_type`),
      INDEX `idx_app_feedback_status` (`status`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    echo "Table 'application_feedback' checked/created successfully.\n";

    echo "Ratings & Feedback System Migration completed successfully!\n";

} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
?>
