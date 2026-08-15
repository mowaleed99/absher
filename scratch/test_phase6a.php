<?php
// Scratch test script for Phase 6A automated integration tests
// Run against absher_georgia_staging on VPS

require_once __DIR__ . '/../backend_php/config/db_staging.php';
require_once __DIR__ . '/../backend_php/api_staging/core/jwt.php';

$totalPassed = 0;
$totalFailed = 0;

function assertTest($name, $condition, $details = '') {
    global $totalPassed, $totalFailed;
    if ($condition) {
        $totalPassed++;
        echo "  ✅ PASS: $name\n";
    } else {
        $totalFailed++;
        echo "  ❌ FAIL: $name - " . (is_string($details) ? $details : json_encode($details, JSON_UNESCAPED_UNICODE)) . "\n";
    }
}

echo "===================================================\n";
echo "🚀 STARTING PHASE 6A AUTOMATED INTEGRATION TEST SUITE\n";
echo "===================================================\n\n";

// Pre-test Setup: Create test student and test service in Staging
$conn->exec("DELETE FROM promo_code_redemptions WHERE code_snapshot LIKE 'TEST_%'");
$conn->exec("DELETE FROM service_requests WHERE details LIKE '%test%' OR details LIKE '%Test%' OR student_name LIKE 'Test Student%'");
$conn->exec("DELETE FROM promo_codes WHERE code LIKE 'TEST_%'");
$conn->exec("DELETE FROM students WHERE email LIKE 'test_phase6a_%@absher.test'");
$conn->exec("DELETE FROM services WHERE title LIKE 'TEST_SVC_%'");

$stdStmt = $conn->prepare("INSERT INTO students (full_name, email, phone, points, password, is_blocked) VALUES (?, ?, ?, ?, ?, ?)");
$stdStmt->execute(['Test Student 6A', 'test_phase6a_1@absher.test', '+995555000001', 500, password_hash('pass123', PASSWORD_BCRYPT), 0]);
$testStudentId1 = (int)$conn->lastInsertId();

$stdStmt->execute(['Test Student 6A Blocked', 'test_phase6a_blocked@absher.test', '+995555000002', 500, password_hash('pass123', PASSWORD_BCRYPT), 1]);
$testBlockedStudentId = (int)$conn->lastInsertId();

$svcStmt = $conn->prepare("INSERT INTO services (title, description, image_url, price_points) VALUES (?, 'Test Description', 'https://example.com/icon.png', ?)");
$svcStmt->execute(['TEST_SVC_100', 100]);
$testServiceId100 = (int)$conn->lastInsertId();

$svcStmt->execute(['TEST_SVC_10', 10]);
$testServiceId10 = (int)$conn->lastInsertId();

$svcStmt->execute(['TEST_SVC_FREE', 0]);
$testServiceIdFree = (int)$conn->lastInsertId();

$jwtToken1 = JWT::encode(['student_id' => $testStudentId1, 'email' => 'test_phase6a_1@absher.test']);
$jwtTokenBlocked = JWT::encode(['student_id' => $testBlockedStudentId, 'email' => 'test_phase6a_blocked@absher.test']);

// Helper to call validate_promo directly
function callValidatePromo($token, $payload) {
    global $conn;
    $url = 'http://127.0.0.1/api_staging/services/validate_promo.php';
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    $headers = ['Content-Type: application/json'];
    if ($token) {
        $headers[] = 'Authorization: Bearer ' . $token;
    }
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    $res = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['http_code' => $code, 'data' => json_decode($res, true)];
}

// Helper to call submit request
function callSubmitRequest($token, $payload) {
    $url = 'http://127.0.0.1/api_staging/student_requests.php?action=submit';
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    $headers = ['Content-Type: application/json'];
    if ($token) {
        $headers[] = 'Authorization: Bearer ' . $token;
    }
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    $res = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['http_code' => $code, 'data' => json_decode($res, true)];
}

// 1. Discount Arithmetic Tests
echo "--- Group 1: Discount Arithmetic & Promo Types ---\n";

// Promo 1: Percentage 20%
$conn->prepare("INSERT INTO promo_codes (campaign_name, code, discount_type, discount_value, status) VALUES ('Test 20%', 'TEST_PCT20', 'percentage', 20.00, 'active')")->execute();
$res = callValidatePromo($jwtToken1, ['code' => 'TEST_PCT20', 'service_id' => $testServiceId100, 'payment_method' => 'wallet']);
assertTest('test_valid_percentage_discount', $res['http_code'] === 200 && $res['data']['data']['discount_points'] === 20 && $res['data']['data']['final_price'] === 80);

// Promo 2: Percentage with max cap
$conn->prepare("INSERT INTO promo_codes (campaign_name, code, discount_type, discount_value, max_discount_points, status) VALUES ('Test Cap', 'TEST_CAP30', 'percentage', 50.00, 30, 'active')")->execute();
$res = callValidatePromo($jwtToken1, ['code' => 'TEST_CAP30', 'service_id' => $testServiceId100, 'payment_method' => 'wallet']);
assertTest('test_percentage_with_max_cap', $res['http_code'] === 200 && $res['data']['data']['discount_points'] === 30 && $res['data']['data']['final_price'] === 70);

// Promo 3: Percentage floor clamping to at least 1
$conn->prepare("INSERT INTO promo_codes (campaign_name, code, discount_type, discount_value, status) VALUES ('Test Clamp', 'TEST_CLAMP1', 'percentage', 1.00, 'active')")->execute();
$res = callValidatePromo($jwtToken1, ['code' => 'TEST_CLAMP1', 'service_id' => $testServiceId10, 'payment_method' => 'wallet']);
assertTest('test_percentage_floor_clamping_to_at_least_one', $res['http_code'] === 200 && $res['data']['data']['discount_points'] === 1 && $res['data']['data']['final_price'] === 9);

// Promo 4: Fixed 25 points
$conn->prepare("INSERT INTO promo_codes (campaign_name, code, discount_type, discount_value, status) VALUES ('Test Fixed 25', 'TEST_FIXED25', 'fixed', 25.00, 'active')")->execute();
$res = callValidatePromo($jwtToken1, ['code' => 'TEST_FIXED25', 'service_id' => $testServiceId100, 'payment_method' => 'wallet']);
assertTest('test_valid_fixed_discount', $res['http_code'] === 200 && $res['data']['data']['discount_points'] === 25 && $res['data']['data']['final_price'] === 75);

// Promo 5: Fixed discount exceeds price
$conn->prepare("INSERT INTO promo_codes (campaign_name, code, discount_type, discount_value, status) VALUES ('Test Fixed 150', 'TEST_FIXED150', 'fixed', 150.00, 'active')")->execute();
$res = callValidatePromo($jwtToken1, ['code' => 'TEST_FIXED150', 'service_id' => $testServiceId100, 'payment_method' => 'wallet']);
assertTest('test_fixed_discount_exceeds_price', $res['http_code'] === 200 && $res['data']['data']['discount_points'] === 100 && $res['data']['data']['final_price'] === 0);

// Promo 6: Free service code
$conn->prepare("INSERT INTO promo_codes (campaign_name, code, discount_type, discount_value, status) VALUES ('Test Free', 'TEST_FREE', 'free', 0.00, 'active')")->execute();
$res = callValidatePromo($jwtToken1, ['code' => 'TEST_FREE', 'service_id' => $testServiceId100, 'payment_method' => 'wallet']);
assertTest('test_free_service_code', $res['http_code'] === 200 && $res['data']['data']['discount_points'] === 100 && $res['data']['data']['final_price'] === 0);

// Promo on Zero-Point Service
$res = callValidatePromo($jwtToken1, ['code' => 'TEST_PCT20', 'service_id' => $testServiceIdFree, 'payment_method' => 'wallet']);
assertTest('test_zero_point_service_rejected', $res['http_code'] === 400 && ($res['data']['error_code'] ?? '') === 'SERVICE_IS_FREE');

echo "\n--- Group 2: Payment Policy & Authentication Security ---\n";

// Test 7: Cash + Promo rejected
$res = callValidatePromo($jwtToken1, ['code' => 'TEST_PCT20', 'service_id' => $testServiceId100, 'payment_method' => 'cash']);
assertTest('test_cash_request_with_promo_rejected', $res['http_code'] === 400 && ($res['data']['error_code'] ?? '') === 'PROMO_WALLET_ONLY');

// Test 8: Cash without promo success
$cashReq = callSubmitRequest($jwtToken1, [
    'service_id' => $testServiceId100,
    'payment_method' => 'cash',
    'student_name' => 'Test Cash',
    'student_phone' => '+995555000001',
    'university' => 'TSMU',
    'details' => 'Ordinary Cash Request'
]);
assertTest('test_cash_request_without_promo_success', $cashReq['http_code'] === 200 && $cashReq['data']['status'] === 'success');

// Test 9: Validate without JWT token -> 401
$res = callValidatePromo('', ['code' => 'TEST_PCT20', 'service_id' => $testServiceId100, 'payment_method' => 'wallet']);
assertTest('test_validate_endpoint_unauthorized', $res['http_code'] === 401 && ($res['data']['error_code'] ?? '') === 'UNAUTHORIZED');

// Test 10: Validate by blocked student -> 403
$res = callValidatePromo($jwtTokenBlocked, ['code' => 'TEST_PCT20', 'service_id' => $testServiceId100, 'payment_method' => 'wallet']);
assertTest('test_validate_endpoint_blocked_student', $res['http_code'] === 403 && ($res['data']['error_code'] ?? '') === 'ACCOUNT_BLOCKED');

// Test 11: Validation response hides internal campaign name
$res = callValidatePromo($jwtToken1, ['code' => 'TEST_PCT20', 'service_id' => $testServiceId100, 'payment_method' => 'wallet']);
assertTest('test_validate_endpoint_hides_campaign_name', !isset($res['data']['data']['campaign_name']));

// Test 12: Code trimming and uppercase
$res = callValidatePromo($jwtToken1, ['code' => '  test_pct20  ', 'service_id' => $testServiceId100, 'payment_method' => 'wallet']);
assertTest('test_code_trimming_and_uppercase', $res['http_code'] === 200 && $res['data']['data']['code'] === 'TEST_PCT20');

// Test 13: Invalid code string
$res = callValidatePromo($jwtToken1, ['code' => 'NON_EXISTENT_CODE_XYZ', 'service_id' => $testServiceId100, 'payment_method' => 'wallet']);
assertTest('test_invalid_code_string', $res['http_code'] === 400 && ($res['data']['error_code'] ?? '') === 'INVALID_CODE');

echo "\n--- Group 3: Status, Dates & Scopes ---\n";

// Test 14: Paused code -> 400 DISABLED
$conn->prepare("INSERT INTO promo_codes (campaign_name, code, discount_type, discount_value, status) VALUES ('Test Paused', 'TEST_PAUSED', 'percentage', 10.00, 'paused')")->execute();
$res = callValidatePromo($jwtToken1, ['code' => 'TEST_PAUSED', 'service_id' => $testServiceId100, 'payment_method' => 'wallet']);
assertTest('test_paused_code', $res['http_code'] === 400 && ($res['data']['error_code'] ?? '') === 'DISABLED');

// Test 15: Future scheduled code -> 400 NOT_STARTED
$conn->prepare("INSERT INTO promo_codes (campaign_name, code, discount_type, discount_value, start_at, status) VALUES ('Test Future', 'TEST_FUTURE', 'percentage', 10.00, DATE_ADD(NOW(), INTERVAL 2 DAY), 'active')")->execute();
$res = callValidatePromo($jwtToken1, ['code' => 'TEST_FUTURE', 'service_id' => $testServiceId100, 'payment_method' => 'wallet']);
assertTest('test_future_scheduled_code', $res['http_code'] === 400 && ($res['data']['error_code'] ?? '') === 'NOT_STARTED');

// Test 16: Expired code -> 400 EXPIRED
$conn->prepare("INSERT INTO promo_codes (campaign_name, code, discount_type, discount_value, expires_at, status) VALUES ('Test Expired', 'TEST_EXPIRED', 'percentage', 10.00, DATE_SUB(NOW(), INTERVAL 2 DAY), 'active')")->execute();
$res = callValidatePromo($jwtToken1, ['code' => 'TEST_EXPIRED', 'service_id' => $testServiceId100, 'payment_method' => 'wallet']);
assertTest('test_expired_code', $res['http_code'] === 400 && ($res['data']['error_code'] ?? '') === 'EXPIRED');

// Test 17: Service Scope Selected Allowed vs Rejected
$conn->prepare("INSERT INTO promo_codes (campaign_name, code, discount_type, discount_value, service_scope, status) VALUES ('Test Svc Scope', 'TEST_SVCSCOPE', 'percentage', 20.00, 'selected', 'active')")->execute();
$promoScopeId = (int)$conn->lastInsertId();
$conn->prepare("INSERT INTO promo_code_services (promo_code_id, service_id) VALUES (?, ?)")->execute([$promoScopeId, $testServiceId100]);

$resAllowed = callValidatePromo($jwtToken1, ['code' => 'TEST_SVCSCOPE', 'service_id' => $testServiceId100, 'payment_method' => 'wallet']);
assertTest('test_service_scope_selected_allowed', $resAllowed['http_code'] === 200);

$resRejected = callValidatePromo($jwtToken1, ['code' => 'TEST_SVCSCOPE', 'service_id' => $testServiceId10, 'payment_method' => 'wallet']);
assertTest('test_service_scope_selected_rejected', $resRejected['http_code'] === 400 && ($resRejected['data']['error_code'] ?? '') === 'SERVICE_NOT_ELIGIBLE');

// Test 18: Audience Scope Selected Allowed vs Rejected
$conn->prepare("INSERT INTO promo_codes (campaign_name, code, discount_type, discount_value, audience_scope, status) VALUES ('Test Aud Scope', 'TEST_AUDSCOPE', 'percentage', 20.00, 'selected', 'active')")->execute();
$promoAudId = (int)$conn->lastInsertId();
$conn->prepare("INSERT INTO promo_code_students (promo_code_id, student_id) VALUES (?, ?)")->execute([$promoAudId, $testStudentId1]);

$resAudAllowed = callValidatePromo($jwtToken1, ['code' => 'TEST_AUDSCOPE', 'service_id' => $testServiceId100, 'payment_method' => 'wallet']);
assertTest('test_audience_scope_selected_allowed', $resAudAllowed['http_code'] === 200);

// Test 19: Minimum service price rule
$conn->prepare("INSERT INTO promo_codes (campaign_name, code, discount_type, discount_value, min_service_price_points, status) VALUES ('Test Min Price', 'TEST_MINPRICE', 'percentage', 20.00, 150, 'active')")->execute();
$resMinPrice = callValidatePromo($jwtToken1, ['code' => 'TEST_MINPRICE', 'service_id' => $testServiceId100, 'payment_method' => 'wallet']);
assertTest('test_min_service_price_rule', $resMinPrice['http_code'] === 400 && ($resMinPrice['data']['error_code'] ?? '') === 'MIN_PRICE_NOT_MET');

echo "\n--- Group 4: Usage Limits & Redemptions ---\n";

// Test 20: Total Usage Limit Exhausted
$conn->prepare("INSERT INTO promo_codes (campaign_name, code, discount_type, discount_value, total_usage_limit, per_student_limit, status) VALUES ('Test Total Limit', 'TEST_TOTALLIMIT', 'fixed', 10.00, 1, 5, 'active')")->execute();
$totLimitPromoId = (int)$conn->lastInsertId();

$sub1 = callSubmitRequest($jwtToken1, [
    'service_id' => $testServiceId100,
    'payment_method' => 'wallet',
    'promo_code' => 'TEST_TOTALLIMIT',
    'student_name' => 'Test Student 1',
    'student_phone' => '+995555000001',
    'university' => 'TSMU',
    'details' => 'First redemption'
]);
assertTest('test_first_redemption_succeeds', $sub1['http_code'] === 200);

$resExhausted = callValidatePromo($jwtToken1, ['code' => 'TEST_TOTALLIMIT', 'service_id' => $testServiceId100, 'payment_method' => 'wallet']);
assertTest('test_total_usage_limit_exhausted', $resExhausted['http_code'] === 400 && ($resExhausted['data']['error_code'] ?? '') === 'TOTAL_LIMIT_REACHED');

// Test 21: Per Student Limit Exhausted
$conn->prepare("INSERT INTO promo_codes (campaign_name, code, discount_type, discount_value, total_usage_limit, per_student_limit, status) VALUES ('Test Per Student', 'TEST_PERSTUDENT', 'fixed', 10.00, 100, 1, 'active')")->execute();
$perStdPromoId = (int)$conn->lastInsertId();

$subStd1 = callSubmitRequest($jwtToken1, [
    'service_id' => $testServiceId100,
    'payment_method' => 'wallet',
    'promo_code' => 'TEST_PERSTUDENT',
    'student_name' => 'Test Student 1',
    'student_phone' => '+995555000001',
    'university' => 'TSMU',
    'details' => 'Per student first redemption'
]);
assertTest('test_per_student_first_succeeds', $subStd1['http_code'] === 200);

$resStdExhausted = callValidatePromo($jwtToken1, ['code' => 'TEST_PERSTUDENT', 'service_id' => $testServiceId100, 'payment_method' => 'wallet']);
assertTest('test_per_student_limit_exhausted', $resStdExhausted['http_code'] === 400 && ($resStdExhausted['data']['error_code'] ?? '') === 'STUDENT_LIMIT_REACHED');

echo "\n--- Group 5: Wallet Deductions & Request Submission Integrity ---\n";

// Test 22: Wallet exact deduction
$ptsBefore = (int)$conn->query("SELECT points FROM students WHERE id = $testStudentId1")->fetchColumn();
$subDiscount = callSubmitRequest($jwtToken1, [
    'service_id' => $testServiceId100,
    'payment_method' => 'wallet',
    'promo_code' => 'TEST_PCT20',
    'student_name' => 'Test Student 1',
    'student_phone' => '+995555000001',
    'university' => 'TSMU',
    'details' => 'Deduction test'
]);
$ptsAfter = (int)$conn->query("SELECT points FROM students WHERE id = $testStudentId1")->fetchColumn();
assertTest('test_wallet_exact_deduction', $ptsBefore - $ptsAfter === 80);

// Test 23: Idempotent request UUID replay
$testUuid = 'uuid_test_' . uniqid();
$subUuid1 = callSubmitRequest($jwtToken1, [
    'service_id' => $testServiceId100,
    'payment_method' => 'wallet',
    'request_uuid' => $testUuid,
    'student_name' => 'Test Student 1',
    'student_phone' => '+995555000001',
    'university' => 'TSMU',
    'details' => 'UUID test'
]);
$subUuid2 = callSubmitRequest($jwtToken1, [
    'service_id' => $testServiceId100,
    'payment_method' => 'wallet',
    'request_uuid' => $testUuid,
    'student_name' => 'Test Student 1',
    'student_phone' => '+995555000001',
    'university' => 'TSMU',
    'details' => 'UUID test duplicate'
]);
$reqId1 = $subUuid1['data']['data']['request_id'] ?? $subUuid1['data']['request_id'] ?? 0;
$reqId2 = $subUuid2['data']['data']['request_id'] ?? $subUuid2['data']['request_id'] ?? 0;
assertTest('test_idempotent_request_uuid_replay', $subUuid1['http_code'] === 200 && $subUuid2['http_code'] === 200 && $reqId1 > 0 && $reqId1 === $reqId2, ['sub1' => $subUuid1, 'sub2' => $subUuid2]);

echo "\n--- Group 6: Cancellation & Automatic Refund State Machine ---\n";

// Helper to call update_request_status as Admin
function callAdminUpdateStatus($payload) {
    $adminToken = JWT::encode(['type' => 'admin', 'admin_id' => 2, 'role' => 'super_admin']);
    $url = 'http://127.0.0.1/api_staging/admin_api.php?action=update_request_status';
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $adminToken
    ]);
    $res = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['http_code' => $code, 'data' => json_decode($res, true)];
}

// Test 24: Cancel discounted wallet request -> refund points_charged and reverse promo
$conn->prepare("INSERT INTO promo_codes (campaign_name, code, discount_type, discount_value, total_usage_limit, per_student_limit, status) VALUES ('Test Cancel Promo', 'TEST_CANCEL_PROMO', 'percentage', 20.00, 100, 10, 'active')")->execute();

$subForCancel = callSubmitRequest($jwtToken1, [
    'service_id' => $testServiceId100,
    'payment_method' => 'wallet',
    'promo_code' => 'TEST_CANCEL_PROMO',
    'student_name' => 'Test Student 1',
    'student_phone' => '+995555000001',
    'university' => 'TSMU',
    'details' => 'Request to cancel'
]);
$reqIdToCancel = (int)($subForCancel['data']['data']['request_id'] ?? $subForCancel['data']['request_id'] ?? 0);
$ptsBeforeCancel = (int)$conn->query("SELECT points FROM students WHERE id = $testStudentId1")->fetchColumn();

$cancelRes = callAdminUpdateStatus([
    'id' => $reqIdToCancel,
    'status' => 'ملغي',
    'cancellation_reason' => 'خدمة غير متاحة حالياً'
]);
$ptsAfterCancel = (int)$conn->query("SELECT points FROM students WHERE id = $testStudentId1")->fetchColumn();
$redStatus = $conn->query("SELECT status FROM promo_code_redemptions WHERE service_request_id = $reqIdToCancel")->fetchColumn();

assertTest('test_cancel_discounted_wallet_request', $cancelRes['http_code'] === 200 && ($ptsAfterCancel - $ptsBeforeCancel === 80) && $redStatus === 'reversed', ['subForCancel' => $subForCancel, 'cancelRes' => $cancelRes, 'ptsBefore' => $ptsBeforeCancel, 'ptsAfter' => $ptsAfterCancel, 'redStatus' => $redStatus]);

// Test 25: Promo can be reused after reversal
$firstReqId = (int)($sub1['data']['data']['request_id'] ?? $sub1['data']['request_id'] ?? 0);
$cancelFirstRes = callAdminUpdateStatus(['id' => $firstReqId, 'status' => 'ملغي', 'cancellation_reason' => 'Reversal test']);
$resReusedAfter = callValidatePromo($jwtToken1, ['code' => 'TEST_TOTALLIMIT', 'service_id' => $testServiceId100, 'payment_method' => 'wallet']);
assertTest('test_promo_reuse_after_reversal', $resReusedAfter['http_code'] === 200 && ($resReusedAfter['data']['data']['is_valid'] ?? false) === true, ['cancelFirst' => $cancelFirstRes, 'resReusedAfter' => $resReusedAfter]);

// Test 26: Attempt to cancel completed request is rejected -> 400
// Give student more points to avoid balance limit in subsequent tests
$conn->exec("UPDATE students SET points = 500 WHERE id = $testStudentId1");

$subCompleted = callSubmitRequest($jwtToken1, [
    'service_id' => $testServiceId100,
    'payment_method' => 'wallet',
    'student_name' => 'Test Student 1',
    'student_phone' => '+995555000001',
    'university' => 'TSMU',
    'details' => 'To complete'
]);
$reqIdCompleted = (int)($subCompleted['data']['data']['request_id'] ?? $subCompleted['data']['request_id'] ?? 0);
callAdminUpdateStatus(['id' => $reqIdCompleted, 'status' => 'مكتمل']);

$cancelCompletedRes = callAdminUpdateStatus([
    'id' => $reqIdCompleted,
    'status' => 'ملغي',
    'cancellation_reason' => 'Try cancel completed'
]);
assertTest('test_cancel_completed_request_rejected', $cancelCompletedRes['http_code'] === 400 && ($cancelCompletedRes['data']['error_code'] ?? '') === 'CANNOT_CANCEL_COMPLETED', $cancelCompletedRes);

// Test 27: Reopening a cancelled request is rejected -> 400
$reopenRes = callAdminUpdateStatus([
    'id' => $reqIdToCancel,
    'status' => 'قيد التنفيذ'
]);
assertTest('test_reopen_cancelled_request_rejected', $reopenRes['http_code'] === 400 && ($reopenRes['data']['error_code'] ?? '') === 'CANNOT_REOPEN_CANCELLED', ['reqId' => $reqIdToCancel, 'reopenRes' => $reopenRes]);

// Test 28: Cancel without reason is rejected -> 400
$subNoReason = callSubmitRequest($jwtToken1, [
    'service_id' => $testServiceId100,
    'payment_method' => 'wallet',
    'student_name' => 'Test Student 1',
    'student_phone' => '+995555000001',
    'university' => 'TSMU',
    'details' => 'No reason test'
]);
$reqNoReasonId = (int)($subNoReason['data']['data']['request_id'] ?? $subNoReason['data']['request_id'] ?? 0);
$cancelNoReason = callAdminUpdateStatus([
    'id' => $reqNoReasonId,
    'status' => 'ملغي',
    'cancellation_reason' => ''
]);
assertTest('test_cancel_missing_reason_rejected', $cancelNoReason['http_code'] === 400 && ($cancelNoReason['data']['error_code'] ?? '') === 'MISSING_REASON', ['reqId' => $reqNoReasonId, 'subNoReason' => $subNoReason, 'cancelNoReason' => $cancelNoReason]);

// Test 29: Idempotent cancellation (calling cancel again returns 200 OK without double refund)
$ptsBeforeRepeat = (int)$conn->query("SELECT points FROM students WHERE id = $testStudentId1")->fetchColumn();
$cancelRepeat = callAdminUpdateStatus([
    'id' => $reqIdToCancel,
    'status' => 'ملغي',
    'cancellation_reason' => 'Repeat cancel'
]);
$ptsAfterRepeat = (int)$conn->query("SELECT points FROM students WHERE id = $testStudentId1")->fetchColumn();
assertTest('test_cancel_already_cancelled_idempotent', $cancelRepeat['http_code'] === 200 && ($ptsBeforeRepeat === $ptsAfterRepeat));

echo "\n--- Group 7: Foreign Key Deletion-Safe Snapshots & Immutability ---\n";

// Test 30: Deleting student preserves redemption history
$stdStmt->execute(['Temporary Student', 'test_phase6a_temp@absher.test', '+995555000099', 500, password_hash('pass123', PASSWORD_BCRYPT), 0]);
$tempStdId = (int)$conn->lastInsertId();
$tempToken = JWT::encode(['student_id' => $tempStdId, 'email' => 'test_phase6a_temp@absher.test']);

$subTemp = callSubmitRequest($tempToken, [
    'service_id' => $testServiceId100,
    'payment_method' => 'wallet',
    'promo_code' => 'TEST_PCT20',
    'student_name' => 'Temporary Student',
    'student_phone' => '+995555000099',
    'university' => 'TSMU',
    'details' => 'Temporary request'
]);
$tempReqId = (int)($subTemp['data']['data']['request_id'] ?? $subTemp['data']['request_id'] ?? 0);

// Delete temporary student
$conn->prepare("DELETE FROM students WHERE id = ?")->execute([$tempStdId]);

$redSnapshot = $conn->query("SELECT student_id, student_name_snapshot, code_snapshot FROM promo_code_redemptions WHERE service_request_id = $tempReqId")->fetch(PDO::FETCH_ASSOC);
assertTest('test_student_deletion_preserves_redemptions', $redSnapshot && $redSnapshot['student_id'] === null && $redSnapshot['student_name_snapshot'] === 'Temporary Student', $redSnapshot);

// Test 31: Promo Code Immutability after use
$adminToken = JWT::encode(['type' => 'admin', 'admin_id' => 1, 'role' => 'super_admin']);
$upPromoRes = (function() use ($adminToken, $totLimitPromoId) {
    $url = 'http://127.0.0.1/api_staging/admin_api.php?action=update_promo_code';
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'id' => $totLimitPromoId,
        'campaign_name' => 'Modified Name',
        'code' => 'NEW_CODE_TRY',
        'discount_type' => 'fixed',
        'discount_value' => 10.0
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json', 'Authorization: Bearer ' . $adminToken]);
    $res = json_decode(curl_exec($ch), true);
    curl_close($ch);
    return $res;
})();
assertTest('test_code_immutability_after_use', ($upPromoRes['status'] ?? '') === 'error');

echo "\n--- Group 8: Concurrency, Unique Refund & Dashboard Summary ---\n";

// Test 37: Unique composite constraint uq_request_tx_type prevents duplicate refund insert
$dupTxThrown = false;
try {
    $conn->beginTransaction();
    $stmtTx1 = $conn->prepare("INSERT INTO wallet_transactions (student_id, service_request_id, amount, type, description, created_at) VALUES (?, ?, 10, 'استرجاع', 'First Refund', NOW())");
    $stmtTx1->execute([$testStudentId1, $reqIdToCancel]);
    // Try second identical type refund for same request
    $stmtTx2 = $conn->prepare("INSERT INTO wallet_transactions (student_id, service_request_id, amount, type, description, created_at) VALUES (?, ?, 10, 'استرجاع', 'Duplicate Refund', NOW())");
    $stmtTx2->execute([$testStudentId1, $reqIdToCancel]);
    $conn->commit();
} catch (PDOException $e) {
    $conn->rollBack();
    $dupTxThrown = (strpos($e->getMessage(), 'Duplicate entry') !== false || $e->getCode() == 23000);
}
assertTest('test_duplicate_cancellation_refund_blocked', $dupTxThrown);

// Test 38: Admin Add Promo Code
$addPromoRes = (function() use ($adminToken) {
    $url = 'http://127.0.0.1/api_staging/admin_api.php?action=add_promo_code';
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'campaign_name' => 'Admin Created Promo',
        'code' => 'ADMIN_NEW20',
        'discount_type' => 'percentage',
        'discount_value' => 20.0,
        'max_discount_points' => 50,
        'status' => 'active',
        'service_scope' => 'all',
        'audience_scope' => 'all'
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json', 'Authorization: Bearer ' . $adminToken]);
    $res = json_decode(curl_exec($ch), true);
    curl_close($ch);
    return $res;
})();
assertTest('test_admin_add_promo_code', ($addPromoRes['status'] ?? '') === 'success' && !empty($addPromoRes['id']));
$newAdminPromoId = $addPromoRes['id'] ?? 0;

// Test 39: Admin Toggle Promo Status
$toggleRes = (function() use ($adminToken, $newAdminPromoId) {
    $url = 'http://127.0.0.1/api_staging/admin_api.php?action=toggle_promo_code_status';
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['id' => $newAdminPromoId]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json', 'Authorization: Bearer ' . $adminToken]);
    $res = json_decode(curl_exec($ch), true);
    curl_close($ch);
    return $res;
})();
assertTest('test_admin_toggle_promo_status', ($toggleRes['status'] ?? '') === 'success' && ($toggleRes['new_status'] ?? '') === 'paused');

// Test 40: Admin Archive Promo
$archiveRes = (function() use ($adminToken, $newAdminPromoId) {
    $url = 'http://127.0.0.1/api_staging/admin_api.php?action=archive_promo_code';
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['id' => $newAdminPromoId]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json', 'Authorization: Bearer ' . $adminToken]);
    $res = json_decode(curl_exec($ch), true);
    curl_close($ch);
    return $res;
})();
assertTest('test_admin_archive_promo', ($archiveRes['status'] ?? '') === 'success');

// Test 41: Admin Get Redemptions Paginated
$redemptionsRes = (function() use ($adminToken, $promoScopeId) {
    $url = "http://127.0.0.1/api_staging/admin_api.php?action=get_promo_redemptions&promo_id=$promoScopeId&page=1&limit=10";
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . $adminToken]);
    $res = json_decode(curl_exec($ch), true);
    curl_close($ch);
    return $res;
})();
assertTest('test_admin_get_redemptions_paginated', ($redemptionsRes['status'] ?? '') === 'success' && isset($redemptionsRes['data']['pagination']));

// Test 42: Dashboard Stats Summary Payload
$dashRes = (function() use ($adminToken) {
    $url = 'http://127.0.0.1/api_staging/admin_api.php?action=get_dashboard_stats';
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . $adminToken]);
    $res = json_decode(curl_exec($ch), true);
    curl_close($ch);
    return $res;
})();
assertTest('test_dashboard_summary_payload', ($dashRes['status'] ?? '') === 'success' && isset($dashRes['data']['active_promos']) && isset($dashRes['data']['total_redemptions']) && isset($dashRes['data']['total_points_saved']));

echo "\n--- Group 9: Production Isolation Check ---\n";

// Test 43: Production database absher_georgia_db is untouched
$prodTables = $conn->query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'absher_georgia_db' AND table_name LIKE '%promo%'")->fetchAll();
assertTest('test_production_isolation', count($prodTables) === 0);

echo "\n===================================================\n";
echo "📊 TEST RESULTS SUMMARY:\n";
echo "   Total Passed: $totalPassed\n";
echo "   Total Failed: $totalFailed\n";
echo "===================================================\n";

exit($totalFailed > 0 ? 1 : 0);
