# Verified Phase 6A Master Implementation Plan — Promo Codes & Discounts

*(Authoritative Architecture, Cancellation & Refund State Machine, Concurrency Safeguards & Execution Roadmap)*

> **⛔ Status: PHASE 6A MASTER PLAN CORRECTED AND COMPLETE — NO IMPLEMENTATION STARTED — WAITING FOR EXPLICIT USER GO**
> 
> | Phase | Description | Status |
> |---|---|---|
> | Phase 1 | Foundation, Auth, Apartments | `COMPLETED / VERIFIED / USER ACCEPTED ✅` |
> | Phase 2 | Districts & Universities | `COMPLETED / VERIFIED / USER ACCEPTED ✅` |
> | Phase 3 | Services & Service Requests | `COMPLETED / VERIFIED / USER ACCEPTED ✅` |
> | Phase 4 | Reviews Moderation, Feedback, Students & Points | `COMPLETED / VERIFIED / USER ACCEPTED ✅` |
> | Phase 5 | News, Notifications, Customer Support Chats | `COMPLETED / VERIFIED / USER ACCEPTED ✅` |
> | Phase 6 | Executive Dashboard & Cross-Module Analytics | `COMPLETED / VERIFIED / USER ACCEPTED ✅` |
> | **Phase 6A** | **Promo Codes & Discounts System** | **MASTER PLAN COMPLETE / APPROVED POLICIES** |
> | Deferred | Housing Offers (Waiting for User Requirements) | `DEFERRED / FROZEN` |
> | Cutover | Phase 7 / Production Promotion | `NOT STARTED — REQUIRES EXPLICIT USER GO` |

---

## 1. Approved Business Directives & Core Policies

### A. Wallet-Only Promo Code Directive
1. **Scope:** Promo codes apply **strictly and exclusively** to Wallet payments (`payment_method = 'wallet'`).
2. **No Cash Conversions:** No cash pricing model, currency conversions, or cash promo discounts exist in Phase 6A.
3. **Backend Enforcement:** Submitting a `promo_code` with `payment_method = 'cash'` is rejected with `HTTP 400 Bad Request` and `error_code: PROMO_WALLET_ONLY` (Arabic: `كود الخصم متاح عند الدفع بنقاط المحفظة فقط`, English: `Promo codes are available for wallet points payments only`).
4. **Flutter UI Rule:** The Promo Code input field is enabled only when "Wallet Points" is selected. Switching from Wallet to Cash immediately clears any applied promo code and resets the price breakdown.
5. **Zero Regression on Cash:** Cash requests submitted without promo codes continue operating unchanged.

---

## 2. Approved Cancellation and Automatic Refund State Machine

```mermaid
stateDiagram-v2
    [*] --> under_review: Student Submits Request (قيد المراجعة)
    under_review --> in_progress: Admin Starts Execution (قيد التنفيذ)
    in_progress --> completed: Admin Marks Completed (مكتمل) [TERMINAL]
    under_review --> cancelled: Admin Cancels (ملغي) [TERMINAL]
    in_progress --> cancelled: Admin Cancels (ملغي) [TERMINAL]
    
    state cancelled {
        [*] --> CheckMethod
        CheckMethod --> WalletRefund: if payment_method == 'wallet'
        CheckMethod --> NoRefund: if cash or free
        
        state WalletRefund {
            [*] --> RefundPoints: Add points_charged back to student
            RefundPoints --> AuditTx: INSERT wallet_transactions (type='استرجاع')
            AuditTx --> CheckPromo: if promo_code was applied
            CheckPromo --> ReversePromo: UPDATE redemptions (status='reversed')
            ReversePromo --> DecrementUsage: UPDATE promo_codes (used_count = used_count - 1)
        }
    }
```

### A. Cancellation Authority & Parameters
- **Authority:** Authenticated Admin only (`AuthMiddleware::requireAdmin()`).
- **Identity:** Resolved strictly from Admin JWT session (`$adminId = intval(AuthMiddleware::$payload['admin_id'] ?? 0)`), never from client payload.
- **Mandatory Reason:** A non-empty string `cancellation_reason` (min 3 chars, max 255 chars) is mandatory.

### B. Allowed Status Transitions (Authoritative Stored Database Values)
- Real Database Statuses (`SELECT DISTINCT status FROM service_requests`): `قيد المراجعة` (Under Review / Default), `قيد التنفيذ` (In Progress), `مكتمل` (Completed), `ملغي` (Cancelled).
- **Valid Transition:** Any non-completed status (`قيد المراجعة`, `قيد التنفيذ`) may transition to `ملغي`.
- **Prohibited Transition:** Completed requests (`مكتمل`) **cannot** be cancelled. Rejected with `HTTP 400 Bad Request` (`CANNOT_CANCEL_COMPLETED_REQUEST`).
- **Terminal State:** A cancelled request (`ملغي`) cannot be transitioned to any other status.
- **Idempotency:** Calling cancel on an already cancelled request returns `HTTP 200 OK` without duplicating financial refunds or usage decrements.

### C. Automatic Wallet Refund & Promo Reversal Rules
1. **Wallet Points Refund:**
   - Refund amount = stored `service_requests.points_charged` (authoritative historical charged amount, immune to subsequent service edits).
   - If `points_charged > 0`: Add `points_charged` to student wallet (`students.points = students.points + points_charged`).
   - Insert exactly one refund audit row in `wallet_transactions` (`type = 'استرجاع'`, `amount = points_charged`, `service_request_id = request.id`).
   - If `points_charged = 0` (e.g. Free promo code or 0-point service): No wallet transaction row is created.
2. **Promo Redemption Reversal:**
   - If the request has an active redemption (`status = 'applied'`):
     - Transition redemption to `status = 'reversed'`, `reversed_at = NOW()`, `reversed_reason = cancellation_reason`.
     - Decrement `promo_codes.used_count = used_count - 1` **only if** the redemption transition affected exactly 1 row.
     - Reversed redemptions are excluded from both total usage limits and per-student usage limits. The student may reuse the code if eligible.
3. **Cash Orders:** 0 points charged -> 0 points refunded. No wallet transactions or promo reversals occur.

### D. Duplicate-Refund Protection (Database Unique Constraint)
- Audit of `wallet_transactions` shows `type VARCHAR(50) NOT NULL` and `uniq_service_request_id` directly on `service_request_id`.
- Staged migration replaces this index with a composite unique index: `UNIQUE KEY uq_request_tx_type (service_request_id, type)`.
- **Guarantee:** Allows exactly 1 deduction (`type = 'خصم'`) and exactly 1 refund (`type = 'استرجاع'`) per request. Concurrent or repeated cancellation calls are physically blocked at the database engine level from creating duplicate refunds.

### E. Atomic Lock Ordering & Execution Sequence
Inside a single MySQL transaction (`$conn->beginTransaction()`):
1. **Lock Request:** `SELECT * FROM service_requests WHERE id = ? FOR UPDATE`
2. **Status Guard:** If `status === 'مكتمل'`, throw `Cannot cancel completed request`. If `status === 'ملغي'`, return cached success (clean exit).
3. **Lock Redemption (if exists):** `SELECT * FROM promo_code_redemptions WHERE service_request_id = ? AND status = 'applied' FOR UPDATE`
4. **Lock Promo Code (if exists):** `SELECT * FROM promo_codes WHERE id = ? FOR UPDATE`
5. **Lock Student Wallet (if `points_charged > 0`):** `SELECT points FROM students WHERE id = ? FOR UPDATE`
6. **Refund Student Wallet:** `UPDATE students SET points = points + ? WHERE id = ?`
7. **Insert Refund Transaction:** `INSERT INTO wallet_transactions (student_id, service_request_id, amount, type, description, created_at) VALUES (?, ?, ?, 'استرجاع', ?, NOW())`
8. **Reverse Promo Redemption:** `UPDATE promo_code_redemptions SET status = 'reversed', reversed_at = NOW(), reversed_reason = ? WHERE id = ? AND status = 'applied'`
9. **Decrement Promo Usage:** If redemption updated, `UPDATE promo_codes SET used_count = used_count - 1 WHERE id = ?`
10. **Record Cancellation Audit on Request:** `UPDATE service_requests SET status = 'ملغي', cancelled_at = NOW(), cancelled_by_admin_id = ?, cancellation_reason = ?, refund_status = ? WHERE id = ?`
11. **Dispatch Internal Bilingual Push Notification:** Insert record into `notifications` table on Staging DB.
12. **Commit Transaction.**

---

## 3. Verified Current-State Codebase & Database Audit

### A. Flutter Mobile Request Flow
- **Form Screen:** [`lib/screens/services_screen.dart`](file:///c:/Users/moham/Desktop/absher/lib/screens/services_screen.dart#L180-L710)
  - Line 189: `final promoCtrl = TextEditingController();`
  - Lines 481–490: Static unvalidated text field.
  - Lines 642–657: Free-text bracket concatenation (`[كود الخصم: XYZ]`).
  - Lines 690–705: `ApiService.submitServiceRequest` does not send discrete promo code.

### B. Mobile API Service Layer
- **File:** [`lib/services/api_service.dart`](file:///c:/Users/moham/Desktop/absher/lib/services/api_service.dart#L523-L576)
  - Accepts `submitServiceRequest` parameters without discrete promo code field.

### C. Backend Request Reception & Pricing
- **File:** [`backend_php/api_staging/student_requests.php`](file:///c:/Users/moham/Desktop/absher/backend_php/api_staging/student_requests.php#L285-L475)
  - Line 293: Resolves service price strictly from `services.price_points`.
  - Line 352: `SELECT points FROM students WHERE id = ? FOR UPDATE` locks student balance.
  - Line 364: Deducts 100% of points via `UPDATE students SET points = points - ? WHERE id = ? AND points >= ?`.
  - Line 375: Inserts into `service_requests`.
  - Line 383: Inserts deduction row into `wallet_transactions`.

### D. Existing Admin Delete Behavior & Foreign Key Resolution
- **File:** [`backend_php/api_staging/admin_api.php`](file:///c:/Users/moham/Desktop/absher/backend_php/api_staging/admin_api.php#L519-L900)
  - Hard delete exists on `students` (`DELETE FROM students WHERE id = ?`) and `services` (`DELETE FROM services WHERE id = ?`).
  - **Resolution:** `promo_code_redemptions` uses `ON DELETE SET NULL` on `student_id`, `service_id`, and `service_request_id` while storing permanent snapshot strings (`student_name_snapshot`, `student_phone_snapshot`, `student_email_snapshot`, `service_title_snapshot`, `request_id_snapshot`). Deletion of students or services will never trigger FK constraint errors.

---

## 4. Database Schema & Safe Staged Migration Plan

### Staged Migration Script: `sql/migrations/2026_08_phase6a_promo_codes.sql`

```sql
-- Migration: Phase 6A Promo Codes, Discounts & Cancellation Refunds
-- Target: absher_georgia_staging ONLY (Production isolated)

SET @dbname = DATABASE();

-- 1. Main Promo Codes Table
CREATE TABLE IF NOT EXISTS `promo_codes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `campaign_name` VARCHAR(255) NOT NULL,
  `code` VARCHAR(50) COLLATE utf8mb4_bin NOT NULL,
  `discount_type` ENUM('percentage', 'fixed', 'free') NOT NULL,
  `discount_value` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `max_discount_points` INT NULL DEFAULT NULL,
  `min_service_price_points` INT NOT NULL DEFAULT 0,
  `start_at` DATETIME NULL DEFAULT NULL,
  `expires_at` DATETIME NULL DEFAULT NULL,
  `status` ENUM('active', 'paused', 'archived') NOT NULL DEFAULT 'active',
  `service_scope` ENUM('all', 'selected') NOT NULL DEFAULT 'all',
  `audience_scope` ENUM('all', 'selected') NOT NULL DEFAULT 'all',
  `total_usage_limit` INT NULL DEFAULT NULL,
  `per_student_limit` INT NOT NULL DEFAULT 1,
  `used_count` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_promo_code` (`code`),
  INDEX `idx_promo_status_dates` (`status`, `start_at`, `expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Promo Code Service Eligibility Junction Table
CREATE TABLE IF NOT EXISTS `promo_code_services` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `promo_code_id` INT NOT NULL,
  `service_id` INT NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_promo_service` (`promo_code_id`, `service_id`),
  CONSTRAINT `fk_pcs_promo` FOREIGN KEY (`promo_code_id`) REFERENCES `promo_codes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pcs_service` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Promo Code Student Audience Junction Table
CREATE TABLE IF NOT EXISTS `promo_code_students` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `promo_code_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_promo_student` (`promo_code_id`, `student_id`),
  CONSTRAINT `fk_pcst_promo` FOREIGN KEY (`promo_code_id`) REFERENCES `promo_codes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pcst_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Immutable Redemption History Table (Deletion-Safe Audit Trail)
CREATE TABLE IF NOT EXISTS `promo_code_redemptions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `promo_code_id` INT NOT NULL,
  `service_request_id` INT NULL,
  `request_id_snapshot` INT NOT NULL,
  `student_id` INT NULL,
  `student_name_snapshot` VARCHAR(150) NOT NULL DEFAULT '',
  `student_phone_snapshot` VARCHAR(50) NOT NULL DEFAULT '',
  `student_email_snapshot` VARCHAR(150) NOT NULL DEFAULT '',
  `service_id` INT NULL,
  `service_title_snapshot` VARCHAR(200) NOT NULL DEFAULT '',
  `code_snapshot` VARCHAR(50) NOT NULL,
  `campaign_snapshot` VARCHAR(255) NOT NULL,
  `discount_type_snapshot` VARCHAR(20) NOT NULL,
  `discount_value_snapshot` DECIMAL(10, 2) NOT NULL,
  `original_price_points` INT NOT NULL,
  `discount_points` INT NOT NULL,
  `final_price_points` INT NOT NULL,
  `payment_method` VARCHAR(30) NOT NULL DEFAULT 'wallet',
  `status` ENUM('applied', 'reversed') NOT NULL DEFAULT 'applied',
  `reversed_at` DATETIME NULL DEFAULT NULL,
  `reversed_reason` VARCHAR(255) NULL DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_redemption_request` (`service_request_id`),
  INDEX `idx_redemption_promo_student` (`promo_code_id`, `student_id`),
  INDEX `idx_redemption_student` (`student_id`, `created_at`),
  CONSTRAINT `fk_pcr_promo` FOREIGN KEY (`promo_code_id`) REFERENCES `promo_codes` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_pcr_request` FOREIGN KEY (`service_request_id`) REFERENCES `service_requests` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_pcr_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_pcr_service` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Staged Extension of service_requests Table
-- Step 5a: Add columns as nullable first
SET @col1 = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'service_requests' AND COLUMN_NAME = 'promo_code_id');
SET @sql1 = IF(@col1 = 0, 'ALTER TABLE service_requests ADD COLUMN promo_code_id INT NULL AFTER service_id', 'SELECT 1');
PREPARE stmt1 FROM @sql1; EXECUTE stmt1; DEALLOCATE PREPARE stmt1;

SET @col2 = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'service_requests' AND COLUMN_NAME = 'discount_points');
SET @sql2 = IF(@col2 = 0, 'ALTER TABLE service_requests ADD COLUMN discount_points INT NULL AFTER service_price_points', 'SELECT 1');
PREPARE stmt2 FROM @sql2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;

SET @col3 = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'service_requests' AND COLUMN_NAME = 'final_price_points');
SET @sql3 = IF(@col3 = 0, 'ALTER TABLE service_requests ADD COLUMN final_price_points INT NULL AFTER discount_points', 'SELECT 1');
PREPARE stmt3 FROM @sql3; EXECUTE stmt3; DEALLOCATE PREPARE stmt3;

SET @col4 = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'service_requests' AND COLUMN_NAME = 'cancelled_at');
SET @sql4 = IF(@col4 = 0, 'ALTER TABLE service_requests ADD COLUMN cancelled_at DATETIME NULL AFTER status', 'SELECT 1');
PREPARE stmt4 FROM @sql4; EXECUTE stmt4; DEALLOCATE PREPARE stmt4;

SET @col5 = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'service_requests' AND COLUMN_NAME = 'cancelled_by_admin_id');
SET @sql5 = IF(@col5 = 0, 'ALTER TABLE service_requests ADD COLUMN cancelled_by_admin_id INT NULL AFTER cancelled_at', 'SELECT 1');
PREPARE stmt5 FROM @sql5; EXECUTE stmt5; DEALLOCATE PREPARE stmt5;

SET @col6 = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'service_requests' AND COLUMN_NAME = 'cancellation_reason');
SET @sql6 = IF(@col6 = 0, 'ALTER TABLE service_requests ADD COLUMN cancellation_reason VARCHAR(255) NULL AFTER cancelled_by_admin_id', 'SELECT 1');
PREPARE stmt6 FROM @sql6; EXECUTE stmt6; DEALLOCATE PREPARE stmt6;

SET @col7 = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'service_requests' AND COLUMN_NAME = 'refund_status');
SET @sql7 = IF(@col7 = 0, 'ALTER TABLE service_requests ADD COLUMN refund_status ENUM(\'none\', \'refunded\', \'not_applicable\') NOT NULL DEFAULT \'none\' AFTER cancellation_reason', 'SELECT 1');
PREPARE stmt7 FROM @sql7; EXECUTE stmt7; DEALLOCATE PREPARE stmt7;

-- Step 5b: Backfill legacy historical rows accurately
UPDATE service_requests 
SET discount_points = 0,
    final_price_points = COALESCE(points_charged, service_price_points, 0)
WHERE final_price_points IS NULL AND payment_method = 'wallet';

UPDATE service_requests 
SET discount_points = 0,
    final_price_points = 0
WHERE final_price_points IS NULL;

-- Step 5c: Apply NOT NULL constraints and foreign keys safely
ALTER TABLE `service_requests`
  MODIFY COLUMN `discount_points` INT NOT NULL DEFAULT 0,
  MODIFY COLUMN `final_price_points` INT NOT NULL DEFAULT 0;

SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'service_requests' AND CONSTRAINT_NAME = 'fk_sr_promo');
SET @sql_fk = IF(@fk_exists = 0, 'ALTER TABLE service_requests ADD CONSTRAINT fk_sr_promo FOREIGN KEY (promo_code_id) REFERENCES promo_codes (id) ON DELETE SET NULL', 'SELECT 1');
PREPARE stmt_fk FROM @sql_fk; EXECUTE stmt_fk; DEALLOCATE PREPARE stmt_fk;

SET @fk_admin = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'service_requests' AND CONSTRAINT_NAME = 'fk_sr_admin_cancel');
SET @sql_admin = IF(@fk_admin = 0, 'ALTER TABLE service_requests ADD CONSTRAINT fk_sr_admin_cancel FOREIGN KEY (cancelled_by_admin_id) REFERENCES admins (id) ON DELETE SET NULL', 'SELECT 1');
PREPARE stmt_admin FROM @sql_admin; EXECUTE stmt_admin; DEALLOCATE PREPARE stmt_admin;

-- 6. Upgrade wallet_transactions Unique Index for Duplicate Refund Protection
-- Replaces single-column uniq_service_request_id with (service_request_id, type)
SET @old_idx = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'wallet_transactions' AND INDEX_NAME = 'uniq_service_request_id');
SET @sql_drop = IF(@old_idx > 0, 'ALTER TABLE wallet_transactions DROP INDEX uniq_service_request_id', 'SELECT 1');
PREPARE stmt_drop FROM @sql_drop; EXECUTE stmt_drop; DEALLOCATE PREPARE stmt_drop;

SET @new_idx = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'wallet_transactions' AND INDEX_NAME = 'uq_request_tx_type');
SET @sql_add = IF(@new_idx = 0, 'ALTER TABLE wallet_transactions ADD UNIQUE KEY uq_request_tx_type (service_request_id, type)', 'SELECT 1');
PREPARE stmt_add FROM @sql_add; EXECUTE stmt_add; DEALLOCATE PREPARE stmt_add;
```

---

## 5. Exact Discount Arithmetic & Normalization

1. **Normalization:** `trim(strtoupper($code))`, validated against `/^[A-Z0-9_-]{3,50}$/`.
2. **Percentage Discount (`percentage`):**
   - Value: `0.01 <= discount_value <= 100.00`.
   - Raw Calculation: `$rawDiscount = $originalPricePoints * ($discountValue / 100.0)`.
   - Positive Saving Floor Protection: `$discountPoints = (int)floor($rawDiscount)`. If `$discountPoints === 0 && $originalPricePoints > 0`, clamp to `1` point (provided `1 <= $originalPricePoints`) so that a valid percentage promo always yields at least 1 point of real savings.
   - Max Cap: If `$maxDiscountPoints > 0`, `$discountPoints = min($discountPoints, $maxDiscountPoints)`.
   - Final Price: `$finalPricePoints = max(0, $originalPricePoints - $discountPoints)`.
3. **Fixed Discount (`fixed`):**
   - Value: Integer `1 <= discount_value <= 100000`.
   - Formula: `$discountPoints = min((int)$discountValue, $originalPricePoints)`.
   - Final Price: `$finalPricePoints = max(0, $originalPricePoints - $discountPoints)`.
4. **Free Code (`free`):**
   - Value: `discount_value = 0.00` (ignored during calculation).
   - Formula: `$discountPoints = $originalPricePoints`, `$finalPricePoints = 0`.
5. **Zero-value discounts are prohibited for percentage and fixed types.**

---

## 6. Complete API Contracts & Error Protocols

### A. Student Validation: `POST /api_staging/services/validate_promo.php`
- **Authentication:** **Bearer JWT strictly required**. Unauthenticated -> `HTTP 401 Unauthorized`. `student_id` extracted exclusively from `$payload['student_id']`.
- **Payload:** `{ "code": "SUMMER20", "service_id": 3, "payment_method": "wallet" }`
- **Success (HTTP 200) — Note: Internal `campaign_name` is omitted from public response:**
  ```json
  {
    "status": "success",
    "data": {
      "is_valid": true,
      "promo_code_id": 4,
      "code": "SUMMER20",
      "discount_type": "percentage",
      "discount_value": 20.0,
      "original_price": 100,
      "discount_points": 20,
      "final_price": 80,
      "message": "تم تطبيق كود الخصم بنجاح (-20 نقطة)"
    }
  }
  ```
- **Error Codes (HTTP 400 / 401 / 403):**
  - `UNAUTHORIZED` (401)
  - `PROMO_WALLET_ONLY` (400)
  - `INVALID_CODE` (400)
  - `DISABLED` (400)
  - `NOT_STARTED` (400)
  - `EXPIRED` (400)
  - `TOTAL_LIMIT_REACHED` (400)
  - `STUDENT_LIMIT_REACHED` (400)
  - `SERVICE_NOT_ELIGIBLE` (400)
  - `MIN_PRICE_NOT_MET` (400)
  - `ACCOUNT_BLOCKED` (403)

### B. Student Request Submission: `POST /api_staging/student_requests.php` (action=submit)
- Atomic transaction revalidates promo code, locks student wallet, deducts `final_price_points`, inserts `service_requests` row, inserts `promo_code_redemptions` row, inserts `wallet_transactions` row (`type = 'خصم'`).

### C. Admin Request Status Update: `POST /api_staging/admin_api.php?action=update_request_status`
- **Payload:** `{ "id": 12, "status": "ملغي", "cancellation_reason": "طلب غير متوفر حالياً" }`
- **Success Response (HTTP 200):**
  ```json
  {
    "status": "success",
    "message": "تم إلغاء الطلب واسترجاع النقاط للمحفظة بنجاح",
    "data": {
      "id": 12,
      "status": "ملغي",
      "points_refunded": 80,
      "promo_reversed": true,
      "refund_status": "refunded"
    }
  }
  ```

### D. Complete Admin Promo CRUD Contracts: `POST /api_staging/admin_api.php`
1. **Get All Promos (`action=get_all` or `action=get_promo_codes`):**
   - Returns array of promo codes with aggregated `redemption_count`, `active_status`, and junction lists `service_ids`, `student_ids`.
2. **Add Promo Code (`action=add_promo_code`):**
   - Payload: `{ campaign_name, code, discount_type, discount_value, max_discount_points, min_service_price_points, start_at, expires_at, status, service_scope, service_ids, audience_scope, student_ids, total_usage_limit, per_student_limit }`.
   - Validates: Unique code string, `start_at < expires_at`, non-empty `service_ids` when `service_scope = 'selected'`, non-empty `student_ids` when `audience_scope = 'selected'`.
3. **Update Promo Code (`action=update_promo_code`):**
   - Safety rule: If `used_count > 0`, the `code` string is locked/immutable to preserve audit integrity.
4. **Toggle Status (`action=toggle_promo_code_status`):**
   - Toggles `active` <-> `paused`.
5. **Archive Promo Code (`action=archive_promo_code`):**
   - Sets `status = 'archived'`. Preserves redemption history without hard deletion.
6. **Get Redemptions (`action=get_promo_redemptions&promo_id=X`):**
   - Returns paginated list of redemption rows (`id`, `request_id_snapshot`, `student_name_snapshot`, `student_phone_snapshot`, `service_title_snapshot`, `discount_points`, `final_price_points`, `status`, `created_at`, `reversed_at`, `reversed_reason`).

---

## 7. Complete Flutter Mobile Reactive Flow

```mermaid
sequenceDiagram
    autonumber
    actor S as Student
    participant UI as services_screen.dart
    participant API as api_service.dart
    participant Backend as validate_promo.php

    S->>UI: Select Service (e.g. Price: 100 pts)
    S->>UI: Select Payment Method = 'Wallet Points'
    UI->>UI: Enable Promo Code input field
    S->>UI: Types "SUMMER20" & Clicks [ تطبيق / Apply ]
    UI->>UI: Set _isValidatingPromo = true (Lock button)
    UI->>API: validatePromoCode("SUMMER20", serviceId, "wallet")
    API->>Backend: POST /services/validate_promo.php (Bearer JWT)
    Backend-->>API: 200 OK { is_valid: true, original: 100, discount: 20, final: 80 }
    API-->>UI: Applied Promo Data
    UI->>UI: Render Pricing Card: Original: 100 | Discount: -20 | Final: 80 pts
    
    alt Student changes service dropdown OR switches to Cash
        UI->>UI: Clear _appliedPromoData immediately
        UI->>UI: Reset price display to base service price
    end

    S->>UI: Clicks [ إرسال الطلب / Submit Request ]
    UI->>API: submitServiceRequest(..., promoCode: "SUMMER20")
    Note over API: Sends promo_code structurally (No bracketed text in details)
```

---

## 8. Executive Dashboard Integration

- **Backend API:** [`backend_php/api_staging/admin/dashboard.php`](file:///c:/Users/moham/Desktop/absher/backend_php/api_staging/admin/dashboard.php)
  - Summary aggregation query:
    ```sql
    SELECT 
      (SELECT COUNT(*) FROM promo_codes WHERE status = 'active') AS active_promos,
      (SELECT COUNT(*) FROM promo_code_redemptions WHERE status = 'applied') AS total_redemptions,
      (SELECT COALESCE(SUM(discount_points), 0) FROM promo_code_redemptions WHERE status = 'applied') AS total_points_saved;
    ```
- **React Frontend:**
  - Update [`admin_react/src/types/dashboard.ts`](file:///c:/Users/moham/Desktop/absher/admin_react/src/types/dashboard.ts).
  - Update [`admin_react/src/hooks/useDashboardStats.ts`](file:///c:/Users/moham/Desktop/absher/admin_react/src/hooks/useDashboardStats.ts).
  - Update [`admin_react/src/modules/dashboard/DashboardModule.tsx`](file:///c:/Users/moham/Desktop/absher/admin_react/src/modules/dashboard/DashboardModule.tsx).

---

## 9. Complete List of Files to Create and Modify

### Database:
- `[NEW]` [`sql/migrations/2026_08_phase6a_promo_codes.sql`](file:///c:/Users/moham/Desktop/absher/sql/migrations/2026_08_phase6a_promo_codes.sql)

### Backend PHP:
- `[NEW]` [`backend_php/api_staging/services/validate_promo.php`](file:///c:/Users/moham/Desktop/absher/backend_php/api_staging/services/validate_promo.php)
- `[MODIFY]` [`backend_php/api_staging/student_requests.php`](file:///c:/Users/moham/Desktop/absher/backend_php/api_staging/student_requests.php)
- `[MODIFY]` [`backend_php/api_staging/admin_api.php`](file:///c:/Users/moham/Desktop/absher/backend_php/api_staging/admin_api.php)
- `[MODIFY]` [`backend_php/api_staging/admin/dashboard.php`](file:///c:/Users/moham/Desktop/absher/backend_php/api_staging/admin/dashboard.php)

### Admin React Dashboard:
- `[NEW]` [`admin_react/src/types/promo.ts`](file:///c:/Users/moham/Desktop/absher/admin_react/src/types/promo.ts)
- `[NEW]` [`admin_react/src/hooks/usePromoCodes.ts`](file:///c:/Users/moham/Desktop/absher/admin_react/src/hooks/usePromoCodes.ts)
- `[NEW]` [`admin_react/src/modules/promo/PromoCodesModule.tsx`](file:///c:/Users/moham/Desktop/absher/admin_react/src/modules/promo/PromoCodesModule.tsx)
- `[NEW]` [`admin_react/src/modules/promo/AddPromoCodeModal.tsx`](file:///c:/Users/moham/Desktop/absher/admin_react/src/modules/promo/AddPromoCodeModal.tsx)
- `[NEW]` [`admin_react/src/modules/promo/EditPromoCodeModal.tsx`](file:///c:/Users/moham/Desktop/absher/admin_react/src/modules/promo/EditPromoCodeModal.tsx)
- `[NEW]` [`admin_react/src/modules/promo/PromoDetailsModal.tsx`](file:///c:/Users/moham/Desktop/absher/admin_react/src/modules/promo/PromoDetailsModal.tsx)
- `[MODIFY]` [`admin_react/src/modules/requests/RequestDetailsModal.tsx`](file:///c:/Users/moham/Desktop/absher/admin_react/src/modules/requests/RequestDetailsModal.tsx)
- `[MODIFY]` [`admin_react/src/types/dashboard.ts`](file:///c:/Users/moham/Desktop/absher/admin_react/src/types/dashboard.ts)
- `[MODIFY]` [`admin_react/src/hooks/useDashboardStats.ts`](file:///c:/Users/moham/Desktop/absher/admin_react/src/hooks/useDashboardStats.ts)
- `[MODIFY]` [`admin_react/src/modules/dashboard/DashboardModule.tsx`](file:///c:/Users/moham/Desktop/absher/admin_react/src/modules/dashboard/DashboardModule.tsx)
- `[MODIFY]` [`admin_react/src/App.tsx`](file:///c:/Users/moham/Desktop/absher/admin_react/src/App.tsx)
- `[MODIFY]` [`admin_react/src/layouts/AdminLayout.tsx`](file:///c:/Users/moham/Desktop/absher/admin_react/src/layouts/AdminLayout.tsx)
- `[MODIFY]` [`admin_react/src/lib/i18n.tsx`](file:///c:/Users/moham/Desktop/absher/admin_react/src/lib/i18n.tsx)
- `[MODIFY]` [`admin_react/src/lib/validators.ts`](file:///c:/Users/moham/Desktop/absher/admin_react/src/lib/validators.ts)

### Flutter Mobile App:
- `[MODIFY]` [`lib/services/api_service.dart`](file:///c:/Users/moham/Desktop/absher/lib/services/api_service.dart)
- `[MODIFY]` [`lib/screens/services_screen.dart`](file:///c:/Users/moham/Desktop/absher/lib/screens/services_screen.dart)
- `[MODIFY]` [`lib/services/language_service.dart`](file:///c:/Users/moham/Desktop/absher/lib/services/language_service.dart)

---

## 10. Exact Phase 6A Execution Order & Quality Gate Commands

1. **Step 1: Database Migration & Schema Staging**
   - Apply staged migration to `absher_georgia_staging`.
2. **Step 2: Backend API Implementation**
   - Create `validate_promo.php` with JWT enforcement.
   - Update `student_requests.php` for atomic promo deduction.
   - Update `admin_api.php` for promo CRUD and cancellation/refund state machine.
   - Update `admin/dashboard.php` for promo summary stats.
   - Syntax validation: `php -l backend_php/api_staging/services/validate_promo.php`
3. **Step 3: Automated Backend Verification**
   - Run automated verification suite on VPS Staging.
4. **Step 4: React Admin Implementation**
   - Create types, hooks, and modals in `src/modules/promo/`.
   - Quality Gate: `npm run typecheck` (`tsc --noEmit`)
   - Quality Gate: `npm run lint` (`eslint src --max-warnings 0`)
   - Quality Gate Staging Build: `npm run build:staging` (`tsc && vite build --mode staging`)
5. **Step 5: Flutter App Integration**
   - Update `api_service.dart` with `validatePromoCode`.
   - Redesign Promo Code section in `services_screen.dart`.
   - Quality Gate: `flutter analyze` & `flutter test`
6. **Step 6: Deploy & End-to-End Staging Verification**
   - Deploy bundle to `/admin_v2/` on VPS.
   - Verify SHA-256 asset hashes on Staging web server.
7. **Step 7: Manual User Acceptance Testing (UAT)**
   - Execute manual test checklist.
8. **Step 8: Stop Point**
   - Record user acceptance and await explicit command for Phase 7 (Cutover).

---

## 11. Staging Fixtures & Two-Mode Rollback Plans

### A. Deterministic Staging Fixtures
```sql
-- Fixture 1: 20% Percentage Discount Code
INSERT INTO promo_codes (campaign_name, code, discount_type, discount_value, max_discount_points, min_service_price_points, status, used_count)
VALUES ('خصم ترحيبي 20%', 'WELCOME20', 'percentage', 20.00, 50, 0, 'active', 0)
ON DUPLICATE KEY UPDATE campaign_name=VALUES(campaign_name), discount_value=VALUES(discount_value);

-- Fixture 2: 25 Points Fixed Discount Code
INSERT INTO promo_codes (campaign_name, code, discount_type, discount_value, min_service_price_points, status, used_count)
VALUES ('خصم صيانة 25 نقطة', 'FIXED25', 'fixed', 25.00, 50, 'active', 0)
ON DUPLICATE KEY UPDATE campaign_name=VALUES(campaign_name), discount_value=VALUES(discount_value);

-- Fixture 3: Free Service Code
INSERT INTO promo_codes (campaign_name, code, discount_type, discount_value, status, used_count)
VALUES ('خدمة مجانية للطلاب الجدد', 'FREEPASS', 'free', 0.00, 'active', 0)
ON DUPLICATE KEY UPDATE campaign_name=VALUES(campaign_name), discount_value=VALUES(discount_value);
```

### B. Pre-Use Schema Rollback Plan (Allowed only before any redemption/refund data exists)
```sql
-- 1. Drop foreign keys on existing tables
ALTER TABLE `service_requests` DROP FOREIGN KEY `fk_sr_promo`;
ALTER TABLE `service_requests` DROP FOREIGN KEY `fk_sr_admin_cancel`;

-- 2. Restore old unique index safely
ALTER TABLE `wallet_transactions` DROP INDEX `uq_request_tx_type`;
ALTER TABLE `wallet_transactions` ADD UNIQUE KEY `uniq_service_request_id` (`service_request_id`);

-- 3. Drop added columns on existing tables
ALTER TABLE `service_requests`
  DROP COLUMN `promo_code_id`,
  DROP COLUMN `discount_points`,
  DROP COLUMN `final_price_points`,
  DROP COLUMN `cancelled_at`,
  DROP COLUMN `cancelled_by_admin_id`,
  DROP COLUMN `cancellation_reason`,
  DROP COLUMN `refund_status`;

-- 4. Drop new tables in dependency order
DROP TABLE IF EXISTS `promo_code_redemptions`;
DROP TABLE IF EXISTS `promo_code_students`;
DROP TABLE IF EXISTS `promo_code_services`;
DROP TABLE IF EXISTS `promo_codes`;
```

### C. Post-Use Feature Rollback Plan (After real redemptions or refunds exist)
- **Do not drop tables or columns; do not alter indexes.**
- Disable Promo Code routes in `src/App.tsx` and sidebar link in `src/layouts/AdminLayout.tsx`.
- Disable promo endpoints on backend by returning `HTTP 404 / 410`.
- Roll back web build to previous verified commit SHA (`63eb1f4`).
- **Guarantee:** 100% preservation of all student balances, request statuses, and financial audit logs.

---

## 12. Complete Database Table Inventory (20 Physical Tables)

| # | Table Name | Domain / Purpose | Status / Migration Phase |
|---|---|---|---|
| 1 | `admins` | Admin credentials & JWT auth | Phase 1 ✅ |
| 2 | `apartments` | Apartments listings | Phase 1 ✅ |
| 3 | `districts` | Reference districts list | Phase 2 ✅ |
| 4 | `universities` | Reference universities list | Phase 2 ✅ |
| 5 | `services` | Student services catalog | Phase 3 ✅ |
| 6 | `service_requests` | Student booking requests (extended with promo & cancellation snapshot) | Phase 3 ✅ / Phase 6A |
| 7 | `service_reviews` | Student ratings & testimonials | Phase 4 ✅ |
| 8 | `application_feedback` | User suggestions & bug reports | Phase 4 ✅ |
| 9 | `students` | Student accounts & profiles | Phase 4 ✅ |
| 10 | `blocked_identities` | Persistent blocked identities | Phase 4 ✅ |
| 11 | `wallet_transactions` | Points & wallet audit trail (upgraded unique index) | Phase 4 ✅ / Phase 6A |
| 12 | `news` | Georgia & student news | Phase 5 ✅ |
| 13 | `notifications` | Push broadcast notifications | Phase 5 ✅ |
| 14 | `chats` | Student support conversations | Phase 5 ✅ |
| 15 | `chat_messages` | Chat messages & media | Phase 5 ✅ |
| 16 | `housing_offers` | Exclusive housing discounts | **`DEFERRED / FROZEN`** |
| 17 | **`promo_codes`** | **Promo campaigns & discount rules** | **Phase 6A** |
| 18 | **`promo_code_services`** | **Service-specific promo eligibility** | **Phase 6A** |
| 19 | **`promo_code_students`** | **Student audience promo eligibility** | **Phase 6A** |
| 20 | **`promo_code_redemptions`**| **Immutable redemption snapshot & audit** | **Phase 6A** |

---

## 13. Automated Verification Matrix (45 Test Cases)

1. `test_valid_percentage_discount`: 20% on 100 pt service -> 80 pts charged.
2. `test_percentage_with_max_cap`: 50% capped at 30 pts on 100 pt service -> 70 pts charged.
3. `test_percentage_floor_clamping_to_at_least_one`: 1% on 10 pt service -> 1 pt discount (positive saving).
4. `test_valid_fixed_discount`: 25 pt discount on 100 pt service -> 75 pts charged.
5. `test_fixed_discount_exceeds_price`: 150 pt discount on 100 pt service -> 0 pts charged (never negative).
6. `test_free_service_code`: Free code -> 0 pts charged, 0 wallet deduction, wallet request path.
7. `test_cash_request_with_promo_rejected`: Cash + promo -> 400 Bad Request `PROMO_WALLET_ONLY`.
8. `test_cash_request_without_promo_success`: Ordinary cash request -> 200 OK, unchanged behavior.
9. `test_validate_endpoint_unauthorized`: Validation without JWT token -> 401 Unauthorized.
10. `test_validate_endpoint_blocked_student`: Validation by blocked student -> 403 Forbidden.
11. `test_validate_endpoint_hides_campaign_name`: Student response does not expose internal campaign name.
12. `test_code_trimming_and_uppercase`: Inputs like ` summer20 ` correctly matched as `SUMMER20`.
13. `test_invalid_code_string`: Non-existent code -> 400 `INVALID_CODE`.
14. `test_paused_code`: Paused code -> 400 `DISABLED`.
15. `test_future_scheduled_code`: Code before `start_at` -> 400 `NOT_STARTED`.
16. `test_expired_code`: Code after `expires_at` -> 400 `EXPIRED`.
17. `test_invalid_dates_validation`: `start_at >= expires_at` is rejected during code creation.
18. `test_service_scope_selected_allowed`: Code for Service A applied to Service A -> 200 OK.
19. `test_service_scope_selected_rejected`: Code for Service A applied to Service B -> 400 `SERVICE_NOT_ELIGIBLE`.
20. `test_empty_selected_services_rejected`: Code with `service_scope = 'selected'` and empty array is rejected.
21. `test_audience_scope_selected_allowed`: Private code applied by authorized student -> 200 OK.
22. `test_audience_scope_selected_rejected`: Private code applied by unlisted student -> 400 `INVALID_CODE`.
23. `test_empty_selected_audience_rejected`: Code with `audience_scope = 'selected'` and empty array is rejected.
24. `test_min_service_price_rule`: Code requiring 150 pts on 100 pt service -> 400 `MIN_PRICE_NOT_MET`.
25. `test_total_usage_limit_exhausted`: 11th redemption attempt on code with limit 10 -> 400 `TOTAL_LIMIT_REACHED`.
26. `test_per_student_limit_exhausted`: 2nd redemption attempt by same student on limit 1 -> 400 `STUDENT_LIMIT_REACHED`.
27. `test_concurrent_final_global_usage`: 2 concurrent requests for last available use -> exactly 1 succeeds, 1 fails.
28. `test_concurrent_per_student_limit`: 2 concurrent requests for same student -> exactly 1 succeeds.
29. `test_wallet_exact_deduction`: Student balance deducted by exactly `final_price_points`.
30. `test_idempotent_request_uuid_replay`: Submitting same `request_uuid` returns identical cached response.
31. `test_code_immutability_after_use`: Changing `code` string when `used_count > 0` is rejected.
32. `test_student_deletion_preserves_redemptions`: Hard deleting student sets `student_id = NULL` in redemptions, leaving snapshots intact.
33. `test_service_deletion_preserves_redemptions`: Hard deleting service sets `service_id = NULL` in redemptions, leaving snapshots intact.
34. `test_request_deletion_preserves_redemptions`: Deleting request sets `service_request_id = NULL`, leaving redemption snapshot intact.
35. `test_cancel_normal_wallet_request`: Cancelling normal wallet request refunds exactly `points_charged`.
36. `test_cancel_discounted_wallet_request`: Cancelling discounted wallet request refunds exactly `points_charged`.
37. `test_cancel_free_promo_request`: Cancelling free promo request creates no wallet transaction, reverses redemption.
38. `test_cancel_cash_request`: Cancelling cash request creates no wallet transaction.
39. `test_cancel_completed_request_rejected`: Attempt to cancel completed request (`مكتمل`) returns 400.
40. `test_cancel_already_cancelled_idempotent`: Cancelling an already cancelled request returns 200 OK without double refund.
41. `test_cancel_missing_reason_rejected`: Missing cancellation reason returns 400.
42. `test_duplicate_cancellation_refund_blocked`: Database unique constraint `uq_request_tx_type` blocks duplicate refund inserts.
43. `test_dashboard_summary_payload`: Verifies `dashboard.php` returns lightweight aggregation structure without heavy array lists.
44. `test_transaction_rollback_on_failure`: Simulated failure rolls back all changes cleanly.
45. `test_production_isolation`: Verifies `absher_georgia_db` is 100% untouched.

---

## 14. Staging and Production Safety Confirmation

- **Development & Staging Only:** All migrations, endpoints, and UI will be deployed to Staging (`absher_georgia_staging`, `/api_staging/`, `/admin_v2/`).
- **Production Isolation:** Production (`/admin/`, `/api/`, `absher_georgia_db`, mobile app production build) will remain **100% untouched**.
- **Cutover (Phase 7):** Halted until complete Phase 6A implementation is verified and accepted by user.
