-- قاعدة بيانات تطبيق وموقع أبشر جورجيا (ABSHER Georgia DB) - Production Configuration
-- CREATE DATABASE IF NOT EXISTS `absher_georgia_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE `absher_georgia_db`;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. جدول الأحياء السكنية (Districts)
DROP TABLE IF EXISTS `districts`;
CREATE TABLE `districts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL UNIQUE,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. جدول الجامعات (Universities)
DROP TABLE IF EXISTS `universities`;
CREATE TABLE `universities` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL UNIQUE,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. جدول الطلاب والعملاء (Students)
DROP TABLE IF EXISTS `students`;
CREATE TABLE `students` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `full_name` varchar(150) NOT NULL,
  `email` varchar(150) NOT NULL UNIQUE,
  `phone` varchar(50) NOT NULL UNIQUE,
  `university` varchar(150) DEFAULT 'جامعة تبليسي الطبية (TSMU)',
  `avatar_url` varchar(255) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `points` int(11) DEFAULT 0,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. جدول المشرفين (Admins)
DROP TABLE IF EXISTS `admins`;
CREATE TABLE `admins` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL UNIQUE,
  `email` varchar(150) NOT NULL UNIQUE,
  `password` varchar(255) NOT NULL,
  `role` varchar(50) DEFAULT 'super_admin',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed working Admin account
-- Password: SecureAdminPass2026! (pre-hashed)
INSERT INTO `admins` (`id`, `username`, `email`, `password`, `role`) VALUES
(1, 'absher_admin', 'admin@absher.ge', '$2y$10$penyz06.v7LbxVIfpPEsz.vwWly7Qi8s/galUsCMNLwEH6Nvs4NsC', 'super_admin')
ON DUPLICATE KEY UPDATE `username`=VALUES(`username`);

-- 5. جدول الشقق السكنية (Apartments)
DROP TABLE IF EXISTS `apartments`;
CREATE TABLE `apartments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `price` varchar(100) NOT NULL,
  `location` varchar(255) NOT NULL,
  `proximity` varchar(255) NOT NULL,
  `universities` text DEFAULT NULL, -- JSON array of selected universities
  `capacity` varchar(100) DEFAULT '3 أفراد',
  `rental_type` enum('apartment','room_shared','studio') DEFAULT 'apartment',
  `rooms_count` tinyint(3) unsigned DEFAULT NULL,
  `move_in_type` varchar(50) DEFAULT 'فوري', -- فوري أو ميعاد
  `move_in_date` varchar(100) DEFAULT 'انتقال فوري',
  `images` text NOT NULL, -- JSON array or comma separated
  `features` text NOT NULL, -- JSON array or comma separated
  `description` text NOT NULL,
  `is_available` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `district_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_apartment_district` FOREIGN KEY (`district_id`) REFERENCES `districts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. جدول الخدمات الطلابية (Services)
DROP TABLE IF EXISTS `services`;
CREATE TABLE `services` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `description` text NOT NULL,
  `image_url` varchar(500) NOT NULL,
  `has_form` tinyint(1) DEFAULT 1,
  `price_points` int(11) DEFAULT 0,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. جدول طلبات الخدمات والحجوزات (Service Requests)
DROP TABLE IF EXISTS `service_requests`;
CREATE TABLE `service_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) DEFAULT NULL,
  `service_id` int(11) DEFAULT NULL,
  `service_price_points` int(11) NOT NULL DEFAULT 0,
  `points_charged` int(11) NOT NULL DEFAULT 0,
  `payment_method` varchar(30) NOT NULL DEFAULT 'free',
  `request_uuid` varchar(64) DEFAULT NULL UNIQUE,
  `student_name` varchar(150) NOT NULL,
  `student_phone` varchar(50) NOT NULL,
  `service_title` varchar(200) NOT NULL,
  `details` text NOT NULL,
  `status` varchar(50) DEFAULT 'قيد المراجعة', -- قيد المراجعة، جاري التنفيذ، مكتمل
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_service_request_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_service_request_service` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. جدول تقييمات وآراء الخدمات (Service Reviews)
DROP TABLE IF EXISTS `service_reviews`;
CREATE TABLE `service_reviews` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) DEFAULT NULL,
  `service_request_id` int(11) DEFAULT NULL,
  `student_name` varchar(150) DEFAULT NULL,
  `uni` varchar(150) DEFAULT 'جامعة في جورجيا',
  `rating` int(11) NOT NULL DEFAULT 5,
  `comment` text DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `reviewed_by_admin_id` int(11) DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_service_reviews_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_service_reviews_request` FOREIGN KEY (`service_request_id`) REFERENCES `service_requests` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  UNIQUE KEY `uq_student_service_request` (`student_id`, `service_request_id`),
  INDEX `idx_service_reviews_status` (`status`),
  INDEX `idx_service_reviews_rating` (`rating`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. جدول البلاغات والمقترحات العامة (Application Feedback)
DROP TABLE IF EXISTS `application_feedback`;
CREATE TABLE `application_feedback` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `feedback_type` enum('suggestion','bug','ux','feature') NOT NULL,
  `comment` text NOT NULL,
  `status` enum('pending','reviewed','resolved') DEFAULT 'pending',
  `reviewed_by_admin_id` int(11) DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_app_feedback_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_app_feedback_type` (`feedback_type`),
  INDEX `idx_app_feedback_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. جدول محادثات الدعم الفني (Chats)
DROP TABLE IF EXISTS `chats`;
CREATE TABLE `chats` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) DEFAULT NULL,
  `student_name` varchar(150) NOT NULL,
  `student_uni` varchar(150) DEFAULT 'جامعة في جورجيا',
  `phone` varchar(50) NOT NULL UNIQUE,
  `last_msg` text NOT NULL,
  `status` varchar(50) DEFAULT 'رسالة جديدة',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_activity_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. جدول رسائل المحادثات (Chat Messages)
DROP TABLE IF EXISTS `chat_messages`;
CREATE TABLE `chat_messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `chat_id` int(11) NOT NULL,
  `sender` varchar(50) NOT NULL, -- 'student' or 'admin'
  `text` text NOT NULL,
  `type` varchar(50) DEFAULT 'text', -- 'text','image','voice'
  `image_url` varchar(500) DEFAULT NULL,
  `quote_text` text DEFAULT NULL,
  `quote_sender` varchar(50) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `chat_id` (`chat_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. جدول محفظة النقاط (Wallet Transactions)
DROP TABLE IF EXISTS `wallet_transactions`;
CREATE TABLE `wallet_transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `service_request_id` int(11) DEFAULT NULL,
  `amount` int(11) NOT NULL, -- موجب للإضافة، وسالب للخصم
  `type` varchar(50) NOT NULL, -- 'إضافة' or 'خصم'
  `description` text NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_service_request_id` (`service_request_id`),
  CONSTRAINT `fk_wallet_transaction_service_request` FOREIGN KEY (`service_request_id`) REFERENCES `service_requests` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. جدول الإشعارات (Notifications)
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `body` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. جدول الأخبار (News)
DROP TABLE IF EXISTS `news`;
CREATE TABLE `news` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. جدول عروض السكن الحصرية (Housing Offers)
DROP TABLE IF EXISTS `housing_offers`;
CREATE TABLE `housing_offers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `apartment_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `original_price` decimal(10,2) NOT NULL,
  `offer_price` decimal(10,2) NOT NULL,
  `badge_text` varchar(100) DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `starts_at` datetime DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `display_order` int(11) DEFAULT 0,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_offer_apartment` FOREIGN KEY (`apartment_id`) REFERENCES `apartments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_original_price` CHECK (`original_price` > 0),
  CONSTRAINT `chk_offer_price` CHECK (`offer_price` >= 0 AND `offer_price` < `original_price`),
  CONSTRAINT `chk_dates` CHECK (`starts_at` IS NULL OR `expires_at` IS NULL OR `starts_at` < `expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
