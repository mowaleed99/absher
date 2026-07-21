-- Absher Database Schema v2
-- This is a clean, normalized structure replacing the old split-brain architecture.
-- Requirements included removing ENUMs, normalizing features, and allowing multiple chats per student.

-- 1. `universities`
-- Master list of universities. Kept separate for integrity.
CREATE TABLE `universities` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL UNIQUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. `districts`
-- Master list of geographical districts for location-based filtering.
CREATE TABLE `districts` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL UNIQUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. `students`
-- Registered users. 
-- Modification: `university_id` is now NULLable as requested.
CREATE TABLE `students` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `university_id` INT NULL,
    `full_name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(150) NOT NULL UNIQUE,
    `phone` VARCHAR(50) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `points_balance` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (`university_id`) REFERENCES `universities`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. `admins`
-- Dashboard administrators.
-- Modification: Added `email` with UNIQUE constraint. Replaced ENUM with VARCHAR for role.
CREATE TABLE `admins` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(100) NOT NULL UNIQUE,
    `email` VARCHAR(150) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` VARCHAR(50) NOT NULL DEFAULT 'admin', 
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. `apartments`
-- Available flats.
-- Modification: Added `currency` column defaulting to 'GEL'.
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
    `deleted_at` TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (`district_id`) REFERENCES `districts`(`id`) ON DELETE CASCADE,
    INDEX `idx_price` (`price`),
    INDEX `idx_is_available` (`is_available`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. `apartment_images`
-- Normalized images for apartments instead of JSON.
CREATE TABLE `apartment_images` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `apartment_id` INT NOT NULL,
    `image_url` VARCHAR(500) NOT NULL,
    `is_primary` BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (`apartment_id`) REFERENCES `apartments`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. `apartment_universities`
-- Many-to-Many relationship mapping apartments to nearby universities.
CREATE TABLE `apartment_universities` (
    `apartment_id` INT NOT NULL,
    `university_id` INT NOT NULL,
    PRIMARY KEY (`apartment_id`, `university_id`),
    FOREIGN KEY (`apartment_id`) REFERENCES `apartments`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`university_id`) REFERENCES `universities`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. `features`
-- Master list of features (e.g., 'WiFi', 'AC', 'Balcony').
-- Modification: Replaces `features_json` from v1.
CREATE TABLE `features` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL UNIQUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. `apartment_features`
-- Many-to-Many mapping for apartments and their features.
CREATE TABLE `apartment_features` (
    `apartment_id` INT NOT NULL,
    `feature_id` INT NOT NULL,
    PRIMARY KEY (`apartment_id`, `feature_id`),
    FOREIGN KEY (`apartment_id`) REFERENCES `apartments`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`feature_id`) REFERENCES `features`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. `services`
-- Student services available to be requested.
CREATE TABLE `services` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(200) NOT NULL,
    `description` TEXT NOT NULL,
    `image_url` VARCHAR(500) NOT NULL,
    `price_points` INT DEFAULT 0,
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. `service_requests`
-- Requests/bookings made by students.
-- Modification: Replaced ENUM status with VARCHAR.
CREATE TABLE `service_requests` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `student_id` INT NOT NULL,
    `service_id` INT NOT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'pending', 
    `details` TEXT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE CASCADE,
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. `wallet_transactions`
-- Ledger for the points economy.
-- Modification: Replaced polymorphic reference_id with explicit `service_request_id` FK. Replaced ENUM with VARCHAR.
CREATE TABLE `wallet_transactions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `student_id` INT NOT NULL,
    `amount` INT NOT NULL,
    `transaction_type` VARCHAR(50) NOT NULL, -- e.g., 'credit', 'debit'
    `reason` VARCHAR(255) NOT NULL,
    `service_request_id` INT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`service_request_id`) REFERENCES `service_requests`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. `chats`
-- Chat sessions.
-- Modification: Removed UNIQUE constraint on `student_id` to allow multiple chats per student. Replaced ENUM with VARCHAR.
CREATE TABLE `chats` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `student_id` INT NOT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'open', 
    `last_activity_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
    INDEX `idx_student_id` (`student_id`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. `chat_messages`
-- Individual messages inside a chat.
-- Modification: Replaced ENUMs with VARCHAR.
CREATE TABLE `chat_messages` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `chat_id` INT NOT NULL,
    `sender_type` VARCHAR(50) NOT NULL, -- e.g., 'student', 'admin'
    `message_type` VARCHAR(50) NOT NULL, -- e.g., 'text', 'image'
    `content` TEXT NOT NULL,
    `image_url` VARCHAR(500) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`chat_id`) REFERENCES `chats`(`id`) ON DELETE CASCADE,
    INDEX `idx_chat_created_at` (`chat_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. `notifications`
-- Push/in-app notifications.
CREATE TABLE `notifications` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `student_id` INT NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `body` TEXT NOT NULL,
    `is_read` BOOLEAN DEFAULT FALSE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
    INDEX `idx_student_read` (`student_id`, `is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. `reviews`
-- Student testimonials.
CREATE TABLE `reviews` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `student_id` INT NOT NULL,
    `rating` TINYINT NOT NULL,
    `comment` TEXT NOT NULL,
    `is_approved` BOOLEAN DEFAULT FALSE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. `settings`
-- Global application settings (e.g., app_version, maintenance_mode).
-- Modification: Added per request. Using backticks for reserved keywords `key` and `value`.
CREATE TABLE `settings` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `key` VARCHAR(255) NOT NULL UNIQUE,
    `value` TEXT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
