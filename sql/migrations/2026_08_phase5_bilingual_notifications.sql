-- Phase 5 Migration: Add bilingual fields to notifications table
-- Applies to absher_georgia_staging (Staging only)

ALTER TABLE `notifications`
  ADD COLUMN IF NOT EXISTS `title_ar` varchar(255) DEFAULT NULL AFTER `body`,
  ADD COLUMN IF NOT EXISTS `title_en` varchar(255) DEFAULT NULL AFTER `title_ar`,
  ADD COLUMN IF NOT EXISTS `body_ar` text DEFAULT NULL AFTER `title_en`,
  ADD COLUMN IF NOT EXISTS `body_en` text DEFAULT NULL AFTER `body_ar`;

-- Backfill legacy records so both fields have data
UPDATE `notifications` SET `title_ar` = `title` WHERE `title_ar` IS NULL OR `title_ar` = '';
UPDATE `notifications` SET `body_ar` = `body` WHERE `body_ar` IS NULL OR `body_ar` = '';
