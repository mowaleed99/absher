-- Absher Database Schema v2.1
-- Hardened schema preserving historical records with restricted deletes, updated timestamps, and validation rules.

-- 1. `universities`
CREATE TABLE `universities` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL UNIQUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. `districts`
CREATE TABLE `districts` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL UNIQUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. `students`
-- Modification: `email` and `phone` are now NULLable. Validation moved to app layer.
CREATE TABLE `students` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `university_id` INT NULL,
    `full_name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(150) UNIQUE,
    `phone` VARCHAR(50) UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `points_balance` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (`university_id`) REFERENCES `universities`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. `admins`
-- Modification: Added `updated_at`
CREATE TABLE `admins` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(100) NOT NULL UNIQUE,
    `email` VARCHAR(150) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` VARCHAR(50) NOT NULL DEFAULT 'admin', 
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. `apartments`
-- Modification: Added `updated_at`. `district_id` changed to ON DELETE RESTRICT.
CREATE TABLE `apartments` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `district_id` INT NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `price` DECIMAL(10,2) NOT NULL,
    `currency` CHAR(3) DEFAULT 'GEL',
    `capacity` INT NULL,
    `is_available` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (`district_id`) REFERENCES `districts`(`id`) ON DELETE RESTRICT,
    INDEX `idx_price` (`price`),
    INDEX `idx_is_available` (`is_available`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. `apartment_images`
CREATE TABLE `apartment_images` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `apartment_id` INT NOT NULL,
    `image_url` VARCHAR(500) NOT NULL,
    `is_primary` BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (`apartment_id`) REFERENCES `apartments`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. `apartment_universities`
CREATE TABLE `apartment_universities` (
    `apartment_id` INT NOT NULL,
    `university_id` INT NOT NULL,
    PRIMARY KEY (`apartment_id`, `university_id`),
    FOREIGN KEY (`apartment_id`) REFERENCES `apartments`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`university_id`) REFERENCES `universities`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. `features`
CREATE TABLE `features` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL UNIQUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. `apartment_features`
CREATE TABLE `apartment_features` (
    `apartment_id` INT NOT NULL,
    `feature_id` INT NOT NULL,
    PRIMARY KEY (`apartment_id`, `feature_id`),
    FOREIGN KEY (`apartment_id`) REFERENCES `apartments`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`feature_id`) REFERENCES `features`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. `services`
-- Modification: Added `updated_at`
CREATE TABLE `services` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(200) NOT NULL,
    `description` TEXT NOT NULL,
    `image_url` VARCHAR(500) NOT NULL,
    `price_points` INT DEFAULT 0,
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. `service_requests`
-- Modification: Changed `student_id` and `service_id` to ON DELETE RESTRICT to preserve historical records.
CREATE TABLE `service_requests` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `student_id` INT NOT NULL,
    `service_id` INT NOT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'pending', 
    `details` TEXT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE RESTRICT,
    FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE RESTRICT,
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. `wallet_transactions`
-- Modification: Changed `student_id` to ON DELETE RESTRICT to preserve financial ledgers.
CREATE TABLE `wallet_transactions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `student_id` INT NOT NULL,
    `amount` INT NOT NULL,
    `transaction_type` VARCHAR(50) NOT NULL, 
    `reason` VARCHAR(255) NOT NULL,
    `service_request_id` INT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE RESTRICT,
    FOREIGN KEY (`service_request_id`) REFERENCES `service_requests`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. `chats`
-- Modification: Changed `student_id` to ON DELETE RESTRICT to preserve communication history.
CREATE TABLE `chats` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `student_id` INT NOT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'open', 
    `last_activity_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE RESTRICT,
    INDEX `idx_student_id` (`student_id`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. `chat_messages`
CREATE TABLE `chat_messages` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `chat_id` INT NOT NULL,
    `sender_type` VARCHAR(50) NOT NULL, 
    `message_type` VARCHAR(50) NOT NULL, 
    `content` TEXT NOT NULL,
    `image_url` VARCHAR(500) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`chat_id`) REFERENCES `chats`(`id`) ON DELETE CASCADE,
    INDEX `idx_chat_created_at` (`chat_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. `notifications`
-- Modification: Changed `student_id` to ON DELETE RESTRICT.
CREATE TABLE `notifications` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `student_id` INT NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `body` TEXT NOT NULL,
    `is_read` BOOLEAN DEFAULT FALSE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE RESTRICT,
    INDEX `idx_student_read` (`student_id`, `is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. `reviews`
-- Modification: Added CHECK constraint for `rating` between 1 and 5. Changed `student_id` to ON DELETE RESTRICT.
CREATE TABLE `reviews` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `student_id` INT NOT NULL,
    `rating` TINYINT NOT NULL CHECK (`rating` BETWEEN 1 AND 5),
    `comment` TEXT NOT NULL,
    `is_approved` BOOLEAN DEFAULT FALSE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. `settings`
-- Modification: Renamed columns to `setting_key` and `setting_value` to avoid reserved keyword collisions.
CREATE TABLE `settings` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `setting_key` VARCHAR(255) NOT NULL UNIQUE,
    `setting_value` TEXT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Phase 11.3 Performance Indexes
CREATE INDEX idx_students_deleted_at ON students(deleted_at);
CREATE INDEX idx_service_requests_student_id ON service_requests(student_id);
CREATE INDEX idx_apartment_universities_university_id ON apartment_universities(university_id);

