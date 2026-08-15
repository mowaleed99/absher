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
echo "🚀 STARTING PHASE 6A AUTOMATED INTEGRATION TEST SUITE (FULL 59-TEST SUITE)\n";
echo "===================================================\n\n";

// Pre-test Setup: Clean fixtures in Staging
$conn->exec("DELETE FROM promo_code_redemptions WHERE code_snapshot LIKE 'TEST_%' OR code_snapshot LIKE 'ADMIN_%'");
$conn->exec("DELETE FROM service_requests WHERE details LIKE '%test%' OR details LIKE '%Test%' OR student_name LIKE 'Test Student%' OR student_name LIKE 'Temp Student%'");
$conn->exec("DELETE FROM promo_codes WHERE code LIKE 'TEST_%' OR code LIKE 'ADMIN_%'");
$conn->exec("DELETE FROM students WHERE email LIKE 'test_phase6a_%@absher.test'");
$conn->exec("DELETE FROM services WHERE title LIKE 'TEST_SVC_%'");

$stdStmt = $conn->prepare("INSERT INTO students (full_name, email, phone, points, password, is_blocked) VALUES (?, ?, ?, ?, ?, ?)");
$stdStmt->execute(['Test Student 6A', 'test_phase6a_1@absher.test', '+995555000001', 1500, password_hash('pass123', PASSWORD_BCRYPT), 0]);
$testStudentId1 = (int)$conn->lastInsertId();

$stdStmt->execute(['Test Student 6A Blocked', 'test_phase6a_blocked@absher.test', '+995555000002', 500, password_hash('pass123', PASSWORD_BCRYPT), 1]);
$testBlockedStudentId = (int)$conn->lastInsertId();

$stdStmt->execute(['Test Student 6A Two', 'test_phase6a_2@absher.test', '+995555000003', 1500, password_hash('pass123', PASSWORD_BCRYPT), 0]);
$testStudentId2 = (int)$conn->lastInsertId();

$svcStmt = $conn->prepare("INSERT INTO services (title, description, image_url, price_points) VALUES (?, 'Test Description', 'https://example.com/icon.png', ?)");
$svcStmt->execute(['TEST_SVC_100', 100]);
$testServiceId100 = (int)$conn->lastInsertId();

$svcStmt->execute(['TEST_SVC_10', 10]);
$testServiceId10 = (int)$conn->lastInsertId();

$svcStmt->execute(['TEST_SVC_FREE', 0]);
$testServiceIdFree = (int)$conn->lastInsertId();

$jwtToken1 = JWT::encode(['student_id' => $testStudentId1, 'email' => 'test_phase6a_1@absher.test']);
$jwtToken2 = JWT::encode(['student_id' => $testStudentId2, 'email' => 'test_phase6a_2@absher.test']);
$jwtTokenBlocked = JWT::encode(['student_id' => $testBlockedStudentId, 'email' => 'test_phase6a_blocked@absher.test']);
$adminToken = JWT::encode(['type' => 'admin', 'admin_id' => 1, 'role' => 'super_admin']);

// Helpers
function callValidatePromo($token, $payload) {
    $url = 'http://127.0.0.1/api_staging/services/validate_promo.php';
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    $headers = ['Content-Type: application/json'];
    if ($token !== null) {
        $headers[] = 'Authorization: Bearer ' . $token;
    }
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    $res = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['http_code' => $code, 'data' => json_decode($res, true)];
}

function callSubmitRequest($token, $payload) {
    $url = 'http://127.0.0.1/api_staging/student_requests.php?action=submit';
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    $headers = ['Content-Type: application/json'];
    if ($token !== null) {
        $headers[] = 'Authorization: Bearer ' . $token;
    }
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    $res = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['http_code' => $code, 'data' => json_decode($res, true)];
}

function callAdminUpdateStatus($payload) {
    global $adminToken;
    $url = 'http://127.0.0.1/api_staging/admin_api.php?action=update_request_status';
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json', 'Authorization: Bearer ' . $adminToken]);
    $res = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['http_code' => $code, 'data' => json_decode($res, true)];
}

function executeParallelCurl($requests) {
    $mh = curl_multi_init();
    $curlHandles = [];
    foreach ($requests as $key => $req) {
        $ch = curl_init($req['url']);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($req['payload']));
        $headers = ['Content-Type: application/json'];
        if (!empty($req['token'])) {
            $headers[] = 'Authorization: Bearer ' . $req['token'];
        }
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_multi_add_handle($mh, $ch);
        $curlHandles[$key] = $ch;
    }

    $active = null;
    do {
        $mrc = curl_multi_exec($mh, $active);
    } while ($mrc == CURLM_CALL_MULTI_PERFORM);

    while ($active && $mrc == CURLM_OK) {
        if (curl_multi_select($mh) != -1) {
            do {
                $mrc = curl_multi_exec($mh, $active);
            } while ($mrc == CURLM_CALL_MULTI_PERFORM);
        }
    }

    $results = [];
    foreach ($curlHandles as $key => $ch) {
        $res = curl_multi_getcontent($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $results[$key] = ['http_code' => $code, 'data' => json_decode($res, true)];
        curl_multi_remove_handle($mh, $ch);
        curl_close($ch);
    }
    curl_multi_close($mh);
    return $results;
}

echo "--- Group 1: Discount Arithmetic & Promo Types ---\n";

// 1. Percentage discount: 20% on 100 pt -> 80 pts
$conn->prepare("INSERT INTO promo_codes (campaign_name, code, discount_type, discount_value, max_discount_points, status) VALUES ('Test 20%', 'TEST_PCT20', 'percentage', 20.00, 50, 'active')")->execute();
$res1 = callValidatePromo($jwtToken1, ['code' => 'TEST_PCT20', 'service_id' => $testServiceId100, 'payment_method' => 'wallet']);
assertTest('test_valid_percentage_discount', ($res1['http_code'] === 200 && ($res1['data']['data']['discount_points'] ?? 0) === 20 && ($res1['data']['data']['final_price'] ?? 0) === 80), $res1);

// 2. Percentage with max cap: 50% capped at 30 pts on 100 pt -> 70 pts
$conn->prepare("INSERT INTO promo_codes (campaign_name, code, discount_type, discount_value, max_discount_points, status) VALUES ('Test 50% Cap 30', 'TEST_PCT50_CAP30', 'percentage', 50.00, 30, 'active')")->execute();
$res2 = callValidatePromo($jwtToken1, ['code' => 'TEST_PCT50_CAP30', 'service_id' => $testServiceId100, 'payment_method' => 'wallet']);
assertTest('test_percentage_with_max_cap', ($res2['http_code'] === 200 && ($res2['data']['data']['discount_points'] ?? 0) === 30 && ($res2['data']['data']['final_price'] ?? 0) === 70), $res2);

// 3. Percentage floor clamping to at least 1: 1% on 10 pt -> 1 pt
$conn->prepare("INSERT INTO promo_codes (campaign_name, code, discount_type, discount_value, status) VALUES ('Test 1%', 'TEST_PCT1', 'percentage', 1.00, 'active')")->execute();
$res3 = callValidatePromo($jwtToken1, ['code' => 'TEST_PCT1', 'service_id' => $testServiceId10, 'payment_method' => 'wallet']);
assertTest('test_percentage_floor_clamping_to_at_least_one', ($res3['http_code'] === 200 && ($res3['data']['data']['discount_points'] ?? 0) === 1 && ($res3['data']['data']['final_price'] ?? 0) === 9), $res3);

// 4. Fixed discount: 25 pts on 100 pt -> 75 pts
$conn->prepare("INSERT INTO promo_codes (campaign_name, code, discount_type, discount_value, status) VALUES ('Test Fixed 25', 'TEST_FIX25', 'fixed', 25.00, 'active')")->execute();
$res4 = callValidatePromo($jwtToken1, ['code' => 'TEST_FIX25', 'service_id' => $testServiceId100, 'payment_method' => 'wallet']);
assertTest('test_valid_fixed_discount', ($res4['http_code'] === 200 && ($res4['data']['data']['discount_points'] ?? 0) === 25 && ($res4['data']['data']['final_price'] ?? 0) === 75), $res4);

// 5. Fixed discount exceeds price: 150 pts on 100 pt -> 0 pts
$conn->prepare("INSERT INTO promo_codes (campaign_name, code, discount_type, discount_value, status) VALUES ('Test Fixed 150', 'TEST_FIX150', 'fixed', 150.00, 'active')")->execute();
$res5 = callValidatePromo($jwtToken1, ['code' => 'TEST_FIX150', 'service_id' => $testServiceId100, 'payment_method' => 'wallet']);
assertTest('test_fixed_discount_exceeds_price', ($res5['http_code'] === 200 && ($res5['data']['data']['discount_points'] ?? 0) === 100 && ($res5['data']['data']['final_price'] ?? 0) === 0), $res5);

// 6. Free service code: free on 100 pt -> 0 pts
$conn->prepare("INSERT INTO promo_codes (campaign_name, code, discount_type, discount_value, status) VALUES ('Test Free Pass', 'TEST_FREEPASS', 'free', 0.00, 'active')")->execute();
$res6 = callValidatePromo($jwtToken1, ['code' => 'TEST_FREEPASS', 'service_id' => $testServiceId100, 'payment_method' => 'wallet']);
assertTest('test_free_service_code', ($res6['http_code'] === 200 && ($res6['data']['data']['discount_points'] ?? 0) === 100 && ($res6['data']['data']['final_price'] ?? 0) === 0), $res6);

// 7. Promo code on 0-pt service rejected
$res7 = callValidatePromo($jwtToken1, ['code' => 'TEST_PCT20', 'service_id' => $testServiceIdFree, 'payment_method' => 'wallet']);
assertTest('test_zero_point_service_rejected', ($res7['http_code'] === 400 && ($res7['data']['error_code'] ?? '') === 'SERVICE_IS_FREE'), $res7);

echo "\n--- Group 2: Payment Policy & Authentication Security ---\n";

// 8. Cash request with promo code is rejected -> 400 PROMO_WALLET_ONLY
$res8 = callValidatePromo($jwtToken1, ['code' => 'TEST_PCT20', 'service_id' => $testServiceId100, 'payment_method' => 'cash']);
assertTest('test_cash_request_with_promo_rejected', ($res8['http_code'] === 400 && ($res8['data']['error_code'] ?? '') === 'PROMO_WALLET_ONLY'), $res8);

// 9. Cash request without promo code succeeds
$res9 = callSubmitRequest($jwtToken1, [
    'service_id' => $testServiceId100,
    'payment_method' => 'cash',
    'student_name' => 'Test Student 1',
    'student_phone' => '+995555000001',
    'university' => 'TSMU',
    'details' => 'Cash request without promo'
]);
assertTest('test_cash_request_without_promo_success', ($res9['http_code'] === 200 && ($res9['data']['status'] ?? '') === 'success'), $res9);

// 10. Validate endpoint without JWT -> 401
$res10 = callValidatePromo(null, ['code' => 'TEST_PCT20', 'service_id' => $testServiceId100, 'payment_method' => 'wallet']);
assertTest('test_validate_endpoint_unauthorized', ($res10['http_code'] === 401), $res10);

// 11. Validate endpoint with blocked student -> 403
$res11 = callValidatePromo($jwtTokenBlocked, ['code' => 'TEST_PCT20', 'service_id' => $testServiceId100, 'payment_method' => 'wallet']);
assertTest('test_validate_endpoint_blocked_student', ($res11['http_code'] === 403 && ($res11['data']['error_code'] ?? '') === 'ACCOUNT_BLOCKED'), $res11);

// 12. Public validate response omits internal campaign_name
assertTest('test_validate_endpoint_hides_campaign_name', (!isset($res1['data']['data']['campaign_name'])), $res1['data']);

// 13. Case & whitespace trimming: ' test_pct20 ' matches 'TEST_PCT20'
$res13 = callValidatePromo($jwtToken1, ['code' => '  test_pct20  ', 'service_id' => $testServiceId100, 'payment_method' => 'wallet']);
assertTest('test_code_trimming_and_uppercase', ($res13['http_code'] === 200 && ($res13['data']['data']['is_valid'] ?? false) === true), $res13);

// 14. Non-existent code string -> 400 INVALID_CODE
$res14 = callValidatePromo($jwtToken1, ['code' => 'NON_EXISTENT_CODE_XYZ', 'service_id' => $testServiceId100, 'payment_method' => 'wallet']);
assertTest('test_invalid_code_string', ($res14['http_code'] === 400 && ($res14['data']['error_code'] ?? '') === 'INVALID_CODE'), $res14);

echo "\n--- Group 3: Status, Dates & Scopes ---\n";

// 15. Paused code -> 400 DISABLED
$conn->prepare("INSERT INTO promo_codes (campaign_name, code, discount_type, discount_value, status) VALUES ('Test Paused', 'TEST_PAUSED', 'fixed', 10.00, 'paused')")->execute();
$res15 = callValidatePromo($jwtToken1, ['code' => 'TEST_PAUSED', 'service_id' => $testServiceId100, 'payment_method' => 'wallet']);
assertTest('test_paused_code', ($res15['http_code'] === 400 && ($res15['data']['error_code'] ?? '') === 'DISABLED'), $res15);

// 16. Future scheduled code -> 400 NOT_STARTED
$futureDate = date('Y-m-d H:i:s', time() + 86400 * 5);
$conn->prepare("INSERT INTO promo_codes (campaign_name, code, discount_type, discount_value, start_at, status) VALUES ('Test Future', 'TEST_FUTURE', 'fixed', 10.00, '$futureDate', 'active')")->execute();
$res16 = callValidatePromo($jwtToken1, ['code' => 'TEST_FUTURE', 'service_id' => $testServiceId100, 'payment_method' => 'wallet']);
assertTest('test_future_scheduled_code', ($res16['http_code'] === 400 && ($res16['data']['error_code'] ?? '') === 'NOT_STARTED'), $res16);

// 17. Expired code -> 400 EXPIRED
$pastDate = date('Y-m-d H:i:s', time() - 86400 * 5);
$conn->prepare("INSERT INTO promo_codes (campaign_name, code, discount_type, discount_value, expires_at, status) VALUES ('Test Expired', 'TEST_EXPIRED', 'fixed', 10.00, '$pastDate', 'active')")->execute();
$res17 = callValidatePromo($jwtToken1, ['code' => 'TEST_EXPIRED', 'service_id' => $testServiceId100, 'payment_method' => 'wallet']);
assertTest('test_expired_code', ($res17['http_code'] === 400 && ($res17['data']['error_code'] ?? '') === 'EXPIRED'), $res17);

// 18. Invalid date ranges rejected on creation (start_at >= expires_at)
$invDateRes = (function() use ($adminToken, $futureDate, $pastDate) {
    $url = 'http://127.0.0.1/api_staging/admin_api.php?action=add_promo_code';
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'campaign_name' => 'Invalid Dates Promo',
        'code' => 'TEST_INV_DATES',
        'discount_type' => 'fixed',
        'discount_value' => 10.0,
        'start_at' => $futureDate,
        'expires_at' => $pastDate,
        'status' => 'active'
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json', 'Authorization: Bearer ' . $adminToken]);
    $res = json_decode(curl_exec($ch), true);
    curl_close($ch);
    return $res;
})();
assertTest('test_invalid_date_ranges', ($invDateRes['status'] ?? '') === 'error' && ($invDateRes['error_code'] ?? '') === 'INVALID_DATE_RANGE', $invDateRes);

// 19. Invalid limits rejected on creation
$invLimitsRes = (function() use ($adminToken) {
    $url = 'http://127.0.0.1/api_staging/admin_api.php?action=add_promo_code';
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'campaign_name' => 'Invalid Limits Promo',
        'code' => 'TEST_INV_LIMITS',
        'discount_type' => 'fixed',
        'discount_value' => 10.0,
        'per_student_limit' => 0,
        'status' => 'active'
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json', 'Authorization: Bearer ' . $adminToken]);
    $res = json_decode(curl_exec($ch), true);
    curl_close($ch);
    return $res;
})();
assertTest('test_invalid_limits', ($invLimitsRes['status'] ?? '') === 'error' && ($invLimitsRes['error_code'] ?? '') === 'INVALID_PER_STUDENT_LIMIT', $invLimitsRes);

// 20. Service scope selected: allowed for selected service
$conn->prepare("INSERT INTO promo_codes (campaign_name, code, discount_type, discount_value, service_scope, status) VALUES ('Test Svc Scope', 'TEST_SVC_SCOPE', 'fixed', 15.00, 'selected', 'active')")->execute();
$promoScopeId = (int)$conn->lastInsertId();
$conn->prepare("INSERT INTO promo_code_services (promo_code_id, service_id) VALUES (?, ?)")->execute([$promoScopeId, $testServiceId100]);

$res20 = callValidatePromo($jwtToken1, ['code' => 'TEST_SVC_SCOPE', 'service_id' => $testServiceId100, 'payment_method' => 'wallet']);
assertTest('test_service_scope_selected_allowed', ($res20['http_code'] === 200 && ($res20['data']['data']['is_valid'] ?? false) === true), $res20);

// 21. Service scope selected: rejected for unselected service -> 400 SERVICE_NOT_ELIGIBLE
$res21 = callValidatePromo($jwtToken1, ['code' => 'TEST_SVC_SCOPE', 'service_id' => $testServiceId10, 'payment_method' => 'wallet']);
assertTest('test_service_scope_selected_rejected', ($res21['http_code'] === 400 && ($res21['data']['error_code'] ?? '') === 'SERVICE_NOT_ELIGIBLE'), $res21);

// 22. Empty selected services rejected on creation
$emptySvcRes = (function() use ($adminToken) {
    $url = 'http://127.0.0.1/api_staging/admin_api.php?action=add_promo_code';
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'campaign_name' => 'Empty Svc Promo',
        'code' => 'TEST_EMPTY_SVC',
        'discount_type' => 'fixed',
        'discount_value' => 10.0,
        'service_scope' => 'selected',
        'service_ids' => [],
        'status' => 'active'
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json', 'Authorization: Bearer ' . $adminToken]);
    $res = json_decode(curl_exec($ch), true);
    curl_close($ch);
    return $res;
})();
assertTest('test_empty_selected_services_rejected', ($emptySvcRes['status'] ?? '') === 'error' && ($emptySvcRes['error_code'] ?? '') === 'EMPTY_SERVICES', $emptySvcRes);

// 23. Audience scope selected: allowed for selected student
$conn->prepare("INSERT INTO promo_codes (campaign_name, code, discount_type, discount_value, audience_scope, status) VALUES ('Test Aud Scope', 'TEST_AUD_SCOPE', 'fixed', 15.00, 'selected', 'active')")->execute();
$audScopeId = (int)$conn->lastInsertId();
$conn->prepare("INSERT INTO promo_code_students (promo_code_id, student_id) VALUES (?, ?)")->execute([$audScopeId, $testStudentId1]);

$res23 = callValidatePromo($jwtToken1, ['code' => 'TEST_AUD_SCOPE', 'service_id' => $testServiceId100, 'payment_method' => 'wallet']);
assertTest('test_audience_scope_selected_allowed', ($res23['http_code'] === 200 && ($res23['data']['data']['is_valid'] ?? false) === true), $res23);

// 24. Audience scope selected: rejected for unselected student -> 400 INVALID_CODE
$res24 = callValidatePromo($jwtToken2, ['code' => 'TEST_AUD_SCOPE', 'service_id' => $testServiceId100, 'payment_method' => 'wallet']);
assertTest('test_audience_scope_selected_rejected', ($res24['http_code'] === 400 && ($res24['data']['error_code'] ?? '') === 'INVALID_CODE'), $res24);

// 25. Empty selected audience rejected on creation
$emptyAudRes = (function() use ($adminToken) {
    $url = 'http://127.0.0.1/api_staging/admin_api.php?action=add_promo_code';
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'campaign_name' => 'Empty Aud Promo',
        'code' => 'TEST_EMPTY_AUD',
        'discount_type' => 'fixed',
        'discount_value' => 10.0,
        'audience_scope' => 'selected',
        'student_ids' => [],
        'status' => 'active'
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json', 'Authorization: Bearer ' . $adminToken]);
    $res = json_decode(curl_exec($ch), true);
    curl_close($ch);
    return $res;
})();
assertTest('test_empty_selected_audience_rejected', ($emptyAudRes['status'] ?? '') === 'error' && ($emptyAudRes['error_code'] ?? '') === 'EMPTY_STUDENTS', $emptyAudRes);

// 26. Invalid referenced service/student IDs rejected during creation
$invIdsRes = (function() use ($adminToken) {
    $url = 'http://127.0.0.1/api_staging/admin_api.php?action=add_promo_code';
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'campaign_name' => 'Invalid IDs Promo',
        'code' => 'TEST_INV_IDS',
        'discount_type' => 'fixed',
        'discount_value' => 10.0,
        'service_scope' => 'selected',
        'service_ids' => [9999999],
        'status' => 'active'
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json', 'Authorization: Bearer ' . $adminToken]);
    $res = json_decode(curl_exec($ch), true);
    curl_close($ch);
    return $res;
})();
assertTest('test_invalid_referenced_service_student_ids', ($invIdsRes['status'] ?? '') === 'error' && ($invIdsRes['error_code'] ?? '') === 'INVALID_SERVICE_IDS', $invIdsRes);

// 27. Minimum service price rule: service price < min price -> 400 MIN_PRICE_NOT_MET
$conn->prepare("INSERT INTO promo_codes (campaign_name, code, discount_type, discount_value, min_service_price_points, status) VALUES ('Test Min Price', 'TEST_MINPRICE', 'fixed', 10.00, 150, 'active')")->execute();
$res27 = callValidatePromo($jwtToken1, ['code' => 'TEST_MINPRICE', 'service_id' => $testServiceId100, 'payment_method' => 'wallet']);
assertTest('test_min_service_price_rule', ($res27['http_code'] === 400 && ($res27['data']['error_code'] ?? '') === 'MIN_PRICE_NOT_MET'), $res27);

echo "\n--- Group 4: Usage Limits & Redemptions ---\n";

// 28. First redemption succeeds
$conn->prepare("INSERT INTO promo_codes (campaign_name, code, discount_type, discount_value, total_usage_limit, per_student_limit, status) VALUES ('Test Usage Limit', 'TEST_TOTALLIMIT', 'percentage', 20.00, 1, 1, 'active')")->execute();
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
assertTest('test_first_redemption_succeeds', ($sub1['http_code'] === 200 && ($sub1['data']['status'] ?? '') === 'success'), $sub1);

// 29. Total usage limit exhausted -> 400 TOTAL_LIMIT_REACHED
$res29 = callValidatePromo($jwtToken2, ['code' => 'TEST_TOTALLIMIT', 'service_id' => $testServiceId100, 'payment_method' => 'wallet']);
assertTest('test_total_usage_limit_exhausted', ($res29['http_code'] === 400 && ($res29['data']['error_code'] ?? '') === 'TOTAL_LIMIT_REACHED'), $res29);

// 30. Per-student limit: first use by student succeeds
$conn->prepare("INSERT INTO promo_codes (campaign_name, code, discount_type, discount_value, total_usage_limit, per_student_limit, status) VALUES ('Test Per Student', 'TEST_PERSTD', 'fixed', 10.00, 100, 1, 'active')")->execute();
$sub30 = callSubmitRequest($jwtToken1, [
    'service_id' => $testServiceId100,
    'payment_method' => 'wallet',
    'promo_code' => 'TEST_PERSTD',
    'student_name' => 'Test Student 1',
    'student_phone' => '+995555000001',
    'university' => 'TSMU',
    'details' => 'Per student use 1'
]);
assertTest('test_per_student_first_succeeds', ($sub30['http_code'] === 200 && ($sub30['data']['status'] ?? '') === 'success'), $sub30);

// 31. Per-student limit exhausted -> 400 STUDENT_LIMIT_REACHED
$res31 = callValidatePromo($jwtToken1, ['code' => 'TEST_PERSTD', 'service_id' => $testServiceId100, 'payment_method' => 'wallet']);
assertTest('test_per_student_limit_exhausted', ($res31['http_code'] === 400 && ($res31['data']['error_code'] ?? '') === 'STUDENT_LIMIT_REACHED'), $res31);

echo "\n--- Group 5: True Multi-Curl Simultaneous Concurrency Race Conditions ---\n";

// 32. Concurrent final global promo use: 2 parallel requests race for 1 available slot
$conn->prepare("INSERT INTO promo_codes (campaign_name, code, discount_type, discount_value, total_usage_limit, per_student_limit, status) VALUES ('Test Concurrent Total', 'TEST_RACE_TOTAL', 'fixed', 10.00, 1, 1, 'active')")->execute();
$raceTotalId = (int)$conn->lastInsertId();

$parallelReqs1 = [
    'req1' => [
        'url' => 'http://127.0.0.1/api_staging/student_requests.php?action=submit',
        'token' => $jwtToken1,
        'payload' => [
            'service_id' => $testServiceId100,
            'payment_method' => 'wallet',
            'promo_code' => 'TEST_RACE_TOTAL',
            'student_name' => 'Test Student 1',
            'student_phone' => '+995555000001',
            'university' => 'TSMU',
            'details' => 'Race request 1'
        ]
    ],
    'req2' => [
        'url' => 'http://127.0.0.1/api_staging/student_requests.php?action=submit',
        'token' => $jwtToken2,
        'payload' => [
            'service_id' => $testServiceId100,
            'payment_method' => 'wallet',
            'promo_code' => 'TEST_RACE_TOTAL',
            'student_name' => 'Test Student 2',
            'student_phone' => '+995555000003',
            'university' => 'TSMU',
            'details' => 'Race request 2'
        ]
    ]
];
$raceResults1 = executeParallelCurl($parallelReqs1);
$successCount1 = (($raceResults1['req1']['http_code'] === 200) ? 1 : 0) + (($raceResults1['req2']['http_code'] === 200) ? 1 : 0);
$usedCountInDb1 = (int)$conn->query("SELECT used_count FROM promo_codes WHERE id = $raceTotalId")->fetchColumn();
$redCountInDb1 = (int)$conn->query("SELECT COUNT(*) FROM promo_code_redemptions WHERE promo_code_id = $raceTotalId")->fetchColumn();

assertTest('test_concurrent_final_global_usage', $successCount1 === 1 && $usedCountInDb1 === 1 && $redCountInDb1 === 1, ['successCount' => $successCount1, 'used' => $usedCountInDb1, 'redemptions' => $redCountInDb1, 'results' => $raceResults1]);

// 33. Concurrent per-student limit: 2 parallel requests by same student for limit 1
$conn->prepare("INSERT INTO promo_codes (campaign_name, code, discount_type, discount_value, total_usage_limit, per_student_limit, status) VALUES ('Test Concurrent Per Student', 'TEST_RACE_STD', 'fixed', 10.00, 100, 1, 'active')")->execute();
$raceStdId = (int)$conn->lastInsertId();

$parallelReqs2 = [
    'req1' => [
        'url' => 'http://127.0.0.1/api_staging/student_requests.php?action=submit',
        'token' => $jwtToken1,
        'payload' => [
            'service_id' => $testServiceId100,
            'payment_method' => 'wallet',
            'promo_code' => 'TEST_RACE_STD',
            'student_name' => 'Test Student 1',
            'student_phone' => '+995555000001',
            'university' => 'TSMU',
            'details' => 'Race student req 1'
        ]
    ],
    'req2' => [
        'url' => 'http://127.0.0.1/api_staging/student_requests.php?action=submit',
        'token' => $jwtToken1,
        'payload' => [
            'service_id' => $testServiceId100,
            'payment_method' => 'wallet',
            'promo_code' => 'TEST_RACE_STD',
            'student_name' => 'Test Student 1',
            'student_phone' => '+995555000001',
            'university' => 'TSMU',
            'details' => 'Race student req 2'
        ]
    ]
];
$raceResults2 = executeParallelCurl($parallelReqs2);
$successCount2 = (($raceResults2['req1']['http_code'] === 200) ? 1 : 0) + (($raceResults2['req2']['http_code'] === 200) ? 1 : 0);
$redCountInDb2 = (int)$conn->query("SELECT COUNT(*) FROM promo_code_redemptions WHERE promo_code_id = $raceStdId AND student_id = $testStudentId1")->fetchColumn();

assertTest('test_concurrent_per_student_limit', $successCount2 === 1 && $redCountInDb2 === 1, ['successCount' => $successCount2, 'redemptions' => $redCountInDb2, 'results' => $raceResults2]);

echo "\n--- Group 6: Wallet Deductions & Request Submission Integrity ---\n";

// 34. Wallet deduction is exact (100 pt service with 20 pt discount deducts exactly 80 pts)
$ptsBeforeDeduct = (int)$conn->query("SELECT points FROM students WHERE id = $testStudentId2")->fetchColumn();
$subDeduct = callSubmitRequest($jwtToken2, [
    'service_id' => $testServiceId100,
    'payment_method' => 'wallet',
    'promo_code' => 'TEST_PCT20',
    'student_name' => 'Test Student 2',
    'student_phone' => '+995555000003',
    'university' => 'TSMU',
    'details' => 'Exact deduction test'
]);
$ptsAfterDeduct = (int)$conn->query("SELECT points FROM students WHERE id = $testStudentId2")->fetchColumn();
assertTest('test_wallet_exact_deduction', ($ptsBeforeDeduct - $ptsAfterDeduct === 80), ['before' => $ptsBeforeDeduct, 'after' => $ptsAfterDeduct, 'diff' => $ptsBeforeDeduct - $ptsAfterDeduct]);

// 35. Idempotent request UUID replay
$fixedUuid = '11111111-2222-3333-4444-555555555555';
$subUuid1 = callSubmitRequest($jwtToken2, [
    'service_id' => $testServiceId100,
    'payment_method' => 'wallet',
    'student_name' => 'Test Student 2',
    'student_phone' => '+995555000003',
    'university' => 'TSMU',
    'details' => 'UUID replay test 1',
    'request_uuid' => $fixedUuid
]);
$subUuid2 = callSubmitRequest($jwtToken2, [
    'service_id' => $testServiceId100,
    'payment_method' => 'wallet',
    'student_name' => 'Test Student 2',
    'student_phone' => '+995555000003',
    'university' => 'TSMU',
    'details' => 'UUID replay test 2',
    'request_uuid' => $fixedUuid
]);
$reqIdUuid1 = $subUuid1['data']['data']['request_id'] ?? $subUuid1['data']['request_id'] ?? 1;
$reqIdUuid2 = $subUuid2['data']['data']['request_id'] ?? $subUuid2['data']['request_id'] ?? 2;
assertTest('test_idempotent_request_uuid_replay', ($subUuid1['http_code'] === 200 && $subUuid2['http_code'] === 200 && $reqIdUuid1 === $reqIdUuid2), ['id1' => $reqIdUuid1, 'id2' => $reqIdUuid2]);

echo "\n--- Group 7: Cancellation & Automatic Refund State Machine ---\n";

// 36. Cancel normal wallet request (without promo) -> refunds full 100 points
$subNormal = callSubmitRequest($jwtToken1, [
    'service_id' => $testServiceId100,
    'payment_method' => 'wallet',
    'student_name' => 'Test Student 1',
    'student_phone' => '+995555000001',
    'university' => 'TSMU',
    'details' => 'Normal request for cancellation'
]);
$normalReqId = (int)($subNormal['data']['data']['request_id'] ?? $subNormal['data']['request_id'] ?? 0);
$ptsBeforeNormalCancel = (int)$conn->query("SELECT points FROM students WHERE id = $testStudentId1")->fetchColumn();

$cancelNormalRes = callAdminUpdateStatus([
    'id' => $normalReqId,
    'status' => 'ملغي',
    'cancellation_reason' => 'إلغاء طلب عادي'
]);
$ptsAfterNormalCancel = (int)$conn->query("SELECT points FROM students WHERE id = $testStudentId1")->fetchColumn();
assertTest('test_cancel_normal_wallet_request', ($cancelNormalRes['http_code'] === 200 && ($ptsAfterNormalCancel - $ptsBeforeNormalCancel === 100)), ['before' => $ptsBeforeNormalCancel, 'after' => $ptsAfterNormalCancel, 'diff' => $ptsAfterNormalCancel - $ptsBeforeNormalCancel]);

// 37. Cancel discounted wallet request -> refunds exact points_charged (80 pts) and reverses promo
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

// 38. Cancel free-promo request -> 0 points refunded, 0 wallet transactions, reverses redemption
$subFree = callSubmitRequest($jwtToken1, [
    'service_id' => $testServiceId100,
    'payment_method' => 'wallet',
    'promo_code' => 'TEST_FREEPASS',
    'student_name' => 'Test Student 1',
    'student_phone' => '+995555000001',
    'university' => 'TSMU',
    'details' => 'Free promo request to cancel'
]);
$freeReqId = (int)($subFree['data']['data']['request_id'] ?? $subFree['data']['request_id'] ?? 0);
$ptsBeforeFreeCancel = (int)$conn->query("SELECT points FROM students WHERE id = $testStudentId1")->fetchColumn();
$txCountBeforeFree = (int)$conn->query("SELECT COUNT(*) FROM wallet_transactions WHERE service_request_id = $freeReqId")->fetchColumn();

$cancelFreeRes = callAdminUpdateStatus([
    'id' => $freeReqId,
    'status' => 'ملغي',
    'cancellation_reason' => 'إلغاء طلب مجاني'
]);
$ptsAfterFreeCancel = (int)$conn->query("SELECT points FROM students WHERE id = $testStudentId1")->fetchColumn();
$txCountAfterFree = (int)$conn->query("SELECT COUNT(*) FROM wallet_transactions WHERE service_request_id = $freeReqId")->fetchColumn();
$freeRedStatus = $conn->query("SELECT status FROM promo_code_redemptions WHERE service_request_id = $freeReqId")->fetchColumn();

assertTest('test_cancel_free_promo_request', ($cancelFreeRes['http_code'] === 200 && $ptsBeforeFreeCancel === $ptsAfterFreeCancel && $txCountAfterFree === $txCountBeforeFree && $freeRedStatus === 'reversed'), ['freeRedStatus' => $freeRedStatus, 'txBefore' => $txCountBeforeFree, 'txAfter' => $txCountAfterFree]);

// 39. Cancel cash request -> 0 wallet transactions created
$subCash = callSubmitRequest($jwtToken1, [
    'service_id' => $testServiceId100,
    'payment_method' => 'cash',
    'student_name' => 'Test Student 1',
    'student_phone' => '+995555000001',
    'university' => 'TSMU',
    'details' => 'Cash request to cancel'
]);
$cashReqId = (int)($subCash['data']['data']['request_id'] ?? $subCash['data']['request_id'] ?? 0);
$cancelCashRes = callAdminUpdateStatus([
    'id' => $cashReqId,
    'status' => 'ملغي',
    'cancellation_reason' => 'إلغاء طلب كاش'
]);
$cashTxCount = (int)$conn->query("SELECT COUNT(*) FROM wallet_transactions WHERE service_request_id = $cashReqId")->fetchColumn();
assertTest('test_cancel_cash_request', ($cancelCashRes['http_code'] === 200 && $cashTxCount === 0));

// 40. Promo reuse after reversal: student can redeem the code again once request is cancelled
$reqIdSub1 = (int)($sub1['data']['data']['request_id'] ?? $sub1['data']['request_id'] ?? 0);
callAdminUpdateStatus(['id' => $reqIdSub1, 'status' => 'ملغي', 'cancellation_reason' => 'Cancel sub1 for reversal test']);
$resReusedAfter = callValidatePromo($jwtToken1, ['code' => 'TEST_TOTALLIMIT', 'service_id' => $testServiceId100, 'payment_method' => 'wallet']);
assertTest('test_promo_reuse_after_reversal', $resReusedAfter['http_code'] === 200 && ($resReusedAfter['data']['data']['is_valid'] ?? false) === true, $resReusedAfter);

// 41. Attempt to cancel completed request is rejected -> 400 CANNOT_CANCEL_COMPLETED
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

// 42. Reopening a cancelled request is rejected -> 400 CANNOT_REOPEN_CANCELLED
$reopenRes = callAdminUpdateStatus([
    'id' => $reqIdToCancel,
    'status' => 'قيد التنفيذ'
]);
assertTest('test_reopen_cancelled_request_rejected', $reopenRes['http_code'] === 400 && ($reopenRes['data']['error_code'] ?? '') === 'CANNOT_REOPEN_CANCELLED', ['reqId' => $reqIdToCancel, 'reopenRes' => $reopenRes]);

// 43. Cancel without reason is rejected -> 400 MISSING_REASON
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
assertTest('test_cancel_missing_reason_rejected', $cancelNoReason['http_code'] === 400 && ($cancelNoReason['data']['error_code'] ?? '') === 'MISSING_REASON', ['reqId' => $reqNoReasonId, 'cancelNoReason' => $cancelNoReason]);

// 44. Idempotent cancellation (calling cancel again returns 200 OK without double refund)
$ptsBeforeRepeat = (int)$conn->query("SELECT points FROM students WHERE id = $testStudentId1")->fetchColumn();
$cancelRepeat = callAdminUpdateStatus([
    'id' => $reqIdToCancel,
    'status' => 'ملغي',
    'cancellation_reason' => 'Repeat cancel'
]);
$ptsAfterRepeat = (int)$conn->query("SELECT points FROM students WHERE id = $testStudentId1")->fetchColumn();
assertTest('test_cancel_already_cancelled_idempotent', $cancelRepeat['http_code'] === 200 && ($ptsBeforeRepeat === $ptsAfterRepeat));

// 45. Concurrent cancellation calls producing exactly one refund
$subForConcCancel = callSubmitRequest($jwtToken1, [
    'service_id' => $testServiceId100,
    'payment_method' => 'wallet',
    'student_name' => 'Test Student 1',
    'student_phone' => '+995555000001',
    'university' => 'TSMU',
    'details' => 'Concurrent cancel test'
]);
$concCancelReqId = (int)($subForConcCancel['data']['data']['request_id'] ?? $subForConcCancel['data']['request_id'] ?? 0);
$ptsBeforeConcCancel = (int)$conn->query("SELECT points FROM students WHERE id = $testStudentId1")->fetchColumn();

$parallelCancelReqs = [
    'c1' => [
        'url' => 'http://127.0.0.1/api_staging/admin_api.php?action=update_request_status',
        'token' => $adminToken,
        'payload' => ['id' => $concCancelReqId, 'status' => 'ملغي', 'cancellation_reason' => 'Parallel Cancel 1']
    ],
    'c2' => [
        'url' => 'http://127.0.0.1/api_staging/admin_api.php?action=update_request_status',
        'token' => $adminToken,
        'payload' => ['id' => $concCancelReqId, 'status' => 'ملغي', 'cancellation_reason' => 'Parallel Cancel 2']
    ]
];
$concCancelRes = executeParallelCurl($parallelCancelReqs);
$ptsAfterConcCancel = (int)$conn->query("SELECT points FROM students WHERE id = $testStudentId1")->fetchColumn();
$refundTxCount = (int)$conn->query("SELECT COUNT(*) FROM wallet_transactions WHERE service_request_id = $concCancelReqId AND type = 'استرجاع'")->fetchColumn();

assertTest('test_concurrent_cancellation_calls_producing_one_refund', ($ptsAfterConcCancel - $ptsBeforeConcCancel === 100) && $refundTxCount === 1, ['refundTxs' => $refundTxCount, 'ptsDiff' => $ptsAfterConcCancel - $ptsBeforeConcCancel, 'res' => $concCancelRes]);

// 46. Historical refund remains points_charged after service price edit
$subHist = callSubmitRequest($jwtToken1, [
    'service_id' => $testServiceId100,
    'payment_method' => 'wallet',
    'promo_code' => 'TEST_PCT20',
    'student_name' => 'Test Student 1',
    'student_phone' => '+995555000001',
    'university' => 'TSMU',
    'details' => 'Historical edit test'
]);
$histReqId = (int)($subHist['data']['data']['request_id'] ?? $subHist['data']['request_id'] ?? 0);
// Now edit service price from 100 to 250 points
$conn->prepare("UPDATE services SET price_points = 250 WHERE id = ?")->execute([$testServiceId100]);

$ptsBeforeHistCancel = (int)$conn->query("SELECT points FROM students WHERE id = $testStudentId1")->fetchColumn();
callAdminUpdateStatus(['id' => $histReqId, 'status' => 'ملغي', 'cancellation_reason' => 'Hist test']);
$ptsAfterHistCancel = (int)$conn->query("SELECT points FROM students WHERE id = $testStudentId1")->fetchColumn();

// Restore service price back to 100
$conn->prepare("UPDATE services SET price_points = 100 WHERE id = ?")->execute([$testServiceId100]);

assertTest('test_historical_refund_remains_points_charged_after_service_edit', ($ptsAfterHistCancel - $ptsBeforeHistCancel === 80), ['diff' => $ptsAfterHistCancel - $ptsBeforeHistCancel]);

echo "\n--- Group 8: Foreign Key Deletion-Safe Snapshots & Immutability ---\n";

// 47. Deleting student preserves redemption history
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
$conn->prepare("DELETE FROM students WHERE id = ?")->execute([$tempStdId]);

$redSnapshotStd = $conn->query("SELECT student_id, student_name_snapshot, code_snapshot FROM promo_code_redemptions WHERE service_request_id = $tempReqId")->fetch(PDO::FETCH_ASSOC);
assertTest('test_student_deletion_preserves_redemptions', $redSnapshotStd && $redSnapshotStd['student_id'] === null && $redSnapshotStd['student_name_snapshot'] === 'Temporary Student', $redSnapshotStd);

// 48. Deleting service preserves redemption history
$svcStmt->execute(['TEST_TEMP_SVC', 100]);
$tempSvcId = (int)$conn->lastInsertId();

$subTempSvc = callSubmitRequest($jwtToken1, [
    'service_id' => $tempSvcId,
    'payment_method' => 'wallet',
    'promo_code' => 'TEST_PCT20',
    'student_name' => 'Test Student 1',
    'student_phone' => '+995555000001',
    'university' => 'TSMU',
    'details' => 'Temporary svc request'
]);
$tempSvcReqId = (int)($subTempSvc['data']['data']['request_id'] ?? $subTempSvc['data']['request_id'] ?? 0);
$conn->prepare("DELETE FROM services WHERE id = ?")->execute([$tempSvcId]);

$redSnapshotSvc = $conn->query("SELECT service_id, service_title_snapshot, code_snapshot FROM promo_code_redemptions WHERE service_request_id = $tempSvcReqId")->fetch(PDO::FETCH_ASSOC);
assertTest('test_service_deletion_preserves_redemptions', $redSnapshotSvc && $redSnapshotSvc['service_id'] === null && $redSnapshotSvc['service_title_snapshot'] === 'TEST_TEMP_SVC', $redSnapshotSvc);

// 49. Deleting request preserves redemption history
$redIdForReqDel = (int)$conn->query("SELECT id FROM promo_code_redemptions WHERE service_request_id = $tempSvcReqId")->fetchColumn();
$conn->prepare("DELETE FROM service_requests WHERE id = ?")->execute([$tempSvcReqId]);
$redSnapshotReq = $conn->query("SELECT service_request_id, request_id_snapshot FROM promo_code_redemptions WHERE id = $redIdForReqDel")->fetch(PDO::FETCH_ASSOC);
assertTest('test_request_deletion_preserves_redemptions', $redSnapshotReq && $redSnapshotReq['service_request_id'] === null && (int)$redSnapshotReq['request_id_snapshot'] === $tempSvcReqId, $redSnapshotReq);

// 50. Promo Code Immutability after use
$conn->prepare("INSERT INTO promo_codes (campaign_name, code, discount_type, discount_value, status, used_count) VALUES ('Used Promo', 'TEST_USED_IMMUTABLE', 'percentage', 20.00, 'active', 3)")->execute();
$usedPromoId = (int)$conn->lastInsertId();

// Insert 3 matching applied redemption records to maintain 100% data consistency
$insRedStmt = $conn->prepare("INSERT INTO promo_code_redemptions (promo_code_id, service_request_id, request_id_snapshot, student_id, student_name_snapshot, student_phone_snapshot, student_email_snapshot, service_id, service_title_snapshot, code_snapshot, campaign_snapshot, discount_type_snapshot, discount_value_snapshot, original_price_points, discount_points, final_price_points, payment_method, status) VALUES (?, NULL, 9999, ?, 'طالب تجريبي', '0500000000', 'test@absher.ge', ?, 'خدمة تجريبية', 'TEST_USED_IMMUTABLE', 'Used Promo', 'percentage', 20.00, 100, 20, 80, 'wallet', 'applied')");
$insRedStmt->execute([$usedPromoId, $testStudentId1, $testServiceId100]);
$insRedStmt->execute([$usedPromoId, $testStudentId1, $testServiceId100]);
$insRedStmt->execute([$usedPromoId, $testStudentId1, $testServiceId100]);

$upPromoRes = (function() use ($adminToken, $usedPromoId) {
    $url = 'http://127.0.0.1/api_staging/admin_api.php?action=update_promo_code';
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'id' => $usedPromoId,
        'campaign_name' => 'Modified Name',
        'code' => 'TEST_MODIFIED_CODE',
        'discount_type' => 'fixed',
        'discount_value' => 10.0
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json', 'Authorization: Bearer ' . $adminToken]);
    $res = json_decode(curl_exec($ch), true);
    curl_close($ch);
    return $res;
})();
assertTest('test_code_immutability_after_use', ($upPromoRes['status'] ?? '') === 'error' && ($upPromoRes['error_code'] ?? '') === 'CODE_IMMUTABLE', $upPromoRes);

// 51. Mid-transaction failure cleanly rolls back
$txRollbackOk = false;
$ptsBeforeSim = (int)$conn->query("SELECT points FROM students WHERE id = $testStudentId1")->fetchColumn();
try {
    $conn->beginTransaction();
    $conn->prepare("UPDATE students SET points = points - 50 WHERE id = ?")->execute([$testStudentId1]);
    // Simulate error
    throw new Exception("Simulated mid-transaction failure");
    $conn->commit();
} catch (Exception $e) {
    $conn->rollBack();
    $ptsAfterSim = (int)$conn->query("SELECT points FROM students WHERE id = $testStudentId1")->fetchColumn();
    $txRollbackOk = ($ptsBeforeSim === $ptsAfterSim);
}
assertTest('test_transaction_rollback_on_failure', $txRollbackOk);

// 52. Unique composite constraint uq_request_tx_type prevents duplicate refund insert
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

echo "\n--- Group 9: Admin Management & Dashboard Stats ---\n";

// 53. Admin Add Promo Code
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

// 54. Admin Toggle Promo Status
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

// 55. Admin Archive Promo
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

// 56. Admin Get Redemptions Paginated
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

// 57. Dashboard Stats Summary Payload
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

echo "\n--- Group 10: Isolation & Production Safety Checks ---\n";

// 58. Staging bundle references /api_staging and not /api
$bundleFiles = glob('/var/www/absher/admin_v2/assets/index-*.js');
$bundleHasApiStaging = false;
if (!empty($bundleFiles)) {
    $bundleContent = file_get_contents($bundleFiles[0]);
    $bundleHasApiStaging = (strpos($bundleContent, '/api_staging') !== false);
}
assertTest('test_staging_bundle_api_root_isolation', $bundleHasApiStaging, ['bundle' => $bundleFiles[0] ?? 'none']);

// 59. Production database absher_georgia_db is untouched
$prodTables = $conn->query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'absher_georgia_db' AND table_name LIKE '%promo%'")->fetchAll();
assertTest('test_production_isolation', count($prodTables) === 0);

// 60. Consistency Test: used_count must strictly equal applied redemption records for every promo code
$inconsistentRows = $conn->query("
    SELECT p.id, p.code, p.used_count, 
           (SELECT COUNT(*) FROM promo_code_redemptions r WHERE r.promo_code_id = p.id AND r.status = 'applied') AS applied_cnt
    FROM promo_codes p
    HAVING p.used_count != applied_cnt
")->fetchAll(PDO::FETCH_ASSOC);
assertTest('test_used_count_equals_applied_redemptions', count($inconsistentRows) === 0, $inconsistentRows);

// --- Mandatory Teardown: Self-Cleaning Test Lifecycle Hook ---
echo "\n--- Teardown: Self-Cleaning Test Lifecycle Hook ---\n";
try {
    $conn->exec("DELETE FROM promo_code_redemptions WHERE code_snapshot LIKE 'TEST_%' OR code_snapshot LIKE 'ADMIN_%'");
    $conn->exec("DELETE FROM wallet_transactions WHERE student_id IN (SELECT id FROM students WHERE email LIKE '%@absher.test')");
    $conn->exec("DELETE FROM service_requests WHERE student_id IN (SELECT id FROM students WHERE email LIKE '%@absher.test') OR promo_code_id IN (SELECT id FROM promo_codes WHERE code LIKE 'TEST_%')");
    $conn->exec("DELETE FROM students WHERE email LIKE '%@absher.test'");
    $conn->exec("DELETE FROM services WHERE title LIKE 'TEST_SVC_%'");
    $conn->exec("DELETE FROM promo_codes WHERE code LIKE 'TEST_%' OR code LIKE 'ADMIN_%'");
    $conn->exec("
        UPDATE promo_codes p
        SET p.used_count = (
            SELECT COUNT(*) 
            FROM promo_code_redemptions r 
            WHERE r.promo_code_id = p.id AND r.status = 'applied'
        )
    ");
    $remPromos = $conn->query("SELECT COUNT(*) FROM promo_codes WHERE code LIKE 'TEST_%'")->fetchColumn();
    $remRedemptions = $conn->query("SELECT COUNT(*) FROM promo_code_redemptions WHERE code_snapshot LIKE 'TEST_%'")->fetchColumn();
    if ((int)$remPromos === 0 && (int)$remRedemptions === 0) {
        echo "  🧹 TEARDOWN SUCCESS: 0 test artifacts remain in absher_georgia_staging.\n";
    } else {
        echo "  ⚠️ WARNING: Residual test artifacts detected after teardown.\n";
    }
} catch (Exception $e) {
    echo "  ⚠️ Teardown error: " . $e->getMessage() . "\n";
}

echo "\n===================================================\n";
echo "📊 TEST RESULTS SUMMARY:\n";
echo "   Total Passed: $totalPassed\n";
echo "   Total Failed: $totalFailed\n";
echo "===================================================\n";

exit($totalFailed > 0 ? 1 : 0);
