-- Migration: Phase 4 Student Administration Extension
-- Target: absher_georgia_staging ONLY (absher_georgia_db remains untouched)

-- 1. Add nationality, admin_status, admin_note, is_blocked to students table (Idempotent)
SET @dbname = DATABASE();

-- Add nationality column if not exists
SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'students' AND COLUMN_NAME = 'nationality'
);
SET @sql = IF(@col_exists = 0, 'ALTER TABLE students ADD COLUMN nationality VARCHAR(100) NULL AFTER university', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add admin_status column if not exists
SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'students' AND COLUMN_NAME = 'admin_status'
);
SET @sql = IF(@col_exists = 0, 'ALTER TABLE students ADD COLUMN admin_status VARCHAR(100) NULL AFTER points', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add admin_note column if not exists
SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'students' AND COLUMN_NAME = 'admin_note'
);
SET @sql = IF(@col_exists = 0, 'ALTER TABLE students ADD COLUMN admin_note TEXT NULL AFTER admin_status', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add is_blocked column if not exists
SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'students' AND COLUMN_NAME = 'is_blocked'
);
SET @sql = IF(@col_exists = 0, 'ALTER TABLE students ADD COLUMN is_blocked TINYINT(1) NOT NULL DEFAULT 0 AFTER admin_note', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Create blocked_identities table for persistent identity blocking across account deletions
CREATE TABLE IF NOT EXISTS blocked_identities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    identifier_type ENUM('email', 'phone') NOT NULL,
    identifier_value VARCHAR(255) NOT NULL,
    normalized_value VARCHAR(255) NOT NULL,
    source_student_id INT NULL,
    reason VARCHAR(255) NULL,
    created_by_admin VARCHAR(100) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_type_norm (identifier_type, normalized_value),
    KEY idx_source_student (source_student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
