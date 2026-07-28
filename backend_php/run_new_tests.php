<?php
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/api/core/jwt.php';

// Disable display errors during test execution to prevent clutter
ini_set('display_errors', '0');

function sendPost($url, $data, $token = null) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    $headers = ['Content-Type: application/json'];
    if ($token) {
        $headers[] = 'Authorization: Bearer ' . $token;
    }
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    
    // Capture HTTP response code
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return [
        'code' => $httpCode,
        'body' => $response,
        'json' => json_decode($response, true)
    ];
}

echo "=== STARTING SERVICE REQUEST PAYMENT INTEGRATION TESTS ===\n\n";

// 1. Setup test student with database cleanup first
$conn->query("DELETE FROM notifications WHERE student_id IN (SELECT id FROM students WHERE email = 'test_pay@example.com' OR phone = '01999999999')");
$conn->query("DELETE FROM wallet_transactions WHERE student_id IN (SELECT id FROM students WHERE email = 'test_pay@example.com' OR phone = '01999999999')");
$conn->query("DELETE FROM chat_messages WHERE chat_id IN (SELECT id FROM chats WHERE student_id IN (SELECT id FROM students WHERE email = 'test_pay@example.com' OR phone = '01999999999'))");
$conn->query("DELETE FROM chat_messages WHERE chat_id IN (SELECT id FROM chats WHERE phone = '01999999999')");
$conn->query("DELETE FROM chats WHERE student_id IN (SELECT id FROM students WHERE email = 'test_pay@example.com' OR phone = '01999999999')");
$conn->query("DELETE FROM chats WHERE phone = '01999999999'");
$conn->query("DELETE FROM service_requests WHERE student_id IN (SELECT id FROM students WHERE email = 'test_pay@example.com' OR phone = '01999999999')");
$conn->query("DELETE FROM service_requests WHERE request_uuid IN ('uuid-free-1', 'uuid-wallet-1', 'uuid-cash-1', 'uuid-rollback-1', 'uuid-missing-1', 'uuid-invalid-1')");
$conn->query("DELETE FROM students WHERE email = 'test_pay@example.com' OR phone = '01999999999'");

$conn->query("INSERT INTO students (full_name, email, phone, university, points, password, created_at) VALUES ('Test Payment Student', 'test_pay@example.com', '01999999999', 'جامعة تبليسي الطبية', 200, 'pass123', NOW())");
$studentId = $conn->lastInsertId();

$token = JWT::encode([
    'student_id' => $studentId,
    'type' => 'student'
]);

// 2. Setup test services (Free & Paid)
$conn->query("DELETE FROM services WHERE title IN ('Test Free Service', 'Test Paid Service')");
$conn->query("INSERT INTO services (title, price_points, description, image_url, has_form) VALUES ('Test Free Service', 0, 'Free test service', '', 1)");
$freeSvcId = $conn->lastInsertId();

$conn->query("INSERT INTO services (title, price_points, description, image_url, has_form) VALUES ('Test Paid Service', 75, 'Paid test service', '', 1)");
$paidSvcId = $conn->lastInsertId();

$baseUrl = 'http://127.0.0.1:8000/api/student_requests.php';

// ==========================================
// TEST 1: Free service with image
// ==========================================
echo "Test 1: Free service with image...\n";
$res1 = sendPost($baseUrl, [
    'service_id' => $freeSvcId,
    'student_name' => 'Test Payment Student',
    'student_phone' => '01999999999',
    'details' => 'Need free service details [رابط الصورة المرفقة: uploads/requests/free_test.jpg]',
    'request_uuid' => 'uuid-free-1'
], $token);

if ($res1['code'] === 200 && $res1['json']['status'] === 'success') {
    $reqId = $res1['json']['data']['request_id'];
    $textMsgId = $res1['json']['data']['chat_text_message_id'];
    $imgMsgId = $res1['json']['data']['chat_image_message_id'];
    
    // Check DB values
    $reqRow = $conn->query("SELECT * FROM service_requests WHERE id = $reqId")->fetch(PDO::FETCH_ASSOC);
    if ($reqRow['payment_method'] === 'free' && (int)$reqRow['service_price_points'] === 0 && (int)$reqRow['points_charged'] === 0 && $reqRow['status'] === 'under_review') {
        echo "  [PASS] Request inserted correctly with status=under_review and payment_method=free\n";
    } else {
        echo "  [FAIL] DB row mismatch: " . print_r($reqRow, true) . "\n";
    }
    
    if ($textMsgId && $imgMsgId) {
        echo "  [PASS] Successfully returned both text_message_id ($textMsgId) and image_message_id ($imgMsgId)\n";
    } else {
        echo "  [FAIL] Missing text or image message ID in response: " . print_r($res1['json'], true) . "\n";
    }
} else {
    echo "  [FAIL] Free service request failed: code=" . $res1['code'] . ", body=" . $res1['body'] . "\n";
}
echo "\n";


// ==========================================
// TEST 2: Paid wallet service with image
// ==========================================
echo "Test 2: Paid wallet service with image...\n";
$res2 = sendPost($baseUrl, [
    'service_id' => $paidSvcId,
    'payment_method' => 'wallet',
    'details' => 'Need paid service details [رابط الصورة المرفقة: uploads/requests/wallet_test.jpg]',
    'request_uuid' => 'uuid-wallet-1'
], $token);

if ($res2['code'] === 200 && $res2['json']['status'] === 'success') {
    $reqId = $res2['json']['data']['request_id'];
    $textMsgId = $res2['json']['data']['chat_text_message_id'];
    $imgMsgId = $res2['json']['data']['chat_image_message_id'];
    
    // Check DB values
    $reqRow = $conn->query("SELECT * FROM service_requests WHERE id = $reqId")->fetch(PDO::FETCH_ASSOC);
    $stdRow = $conn->query("SELECT points FROM students WHERE id = $studentId")->fetch(PDO::FETCH_ASSOC);
    $txRow = $conn->query("SELECT * FROM wallet_transactions WHERE service_request_id = $reqId")->fetch(PDO::FETCH_ASSOC);
    $notifRow = $conn->query("SELECT * FROM notifications WHERE student_id = $studentId ORDER BY id DESC LIMIT 1")->fetch(PDO::FETCH_ASSOC);
    
    if ($reqRow['payment_method'] === 'wallet' && (int)$reqRow['service_price_points'] === 75 && (int)$reqRow['points_charged'] === 75) {
        echo "  [PASS] Request inserted correctly with payment_method=wallet and service_price_points=75\n";
    } else {
        echo "  [FAIL] DB row mismatch: " . print_r($reqRow, true) . "\n";
    }
    
    if ((int)$stdRow['points'] === 125) {
        echo "  [PASS] Student balance correctly deducted (200 - 75 = 125)\n";
    } else {
        echo "  [FAIL] Student balance is " . $stdRow['points'] . " instead of 125\n";
    }
    
    if ($txRow && (int)$txRow['amount'] === 75 && $txRow['type'] === 'خصم') {
        echo "  [PASS] Wallet transaction created correctly for amount 75\n";
    } else {
        echo "  [FAIL] Wallet transaction mismatch: " . print_r($txRow, true) . "\n";
    }
    
    if ($notifRow && strpos($notifRow['body'], '75') !== false) {
        echo "  [PASS] Point deduction notification created correctly\n";
    } else {
        echo "  [FAIL] Notification mismatch: " . print_r($notifRow, true) . "\n";
    }
} else {
    echo "  [FAIL] Paid wallet service failed: code=" . $res2['code'] . ", body=" . $res2['body'] . "\n";
}
echo "\n";


// ==========================================
// TEST 3: Paid cash service with image
// ==========================================
echo "Test 3: Paid cash service with image...\n";
$res3 = sendPost($baseUrl, [
    'service_id' => $paidSvcId,
    'payment_method' => 'cash',
    'details' => 'Need paid service cash details [رابط الصورة المرفقة: uploads/requests/cash_test.jpg]',
    'request_uuid' => 'uuid-cash-1'
], $token);

if ($res3['code'] === 200 && $res3['json']['status'] === 'success') {
    $reqId = $res3['json']['data']['request_id'];
    $textMsgId = $res3['json']['data']['chat_text_message_id'];
    $imgMsgId = $res3['json']['data']['chat_image_message_id'];
    
    // Check DB values
    $reqRow = $conn->query("SELECT * FROM service_requests WHERE id = $reqId")->fetch(PDO::FETCH_ASSOC);
    $stdRow = $conn->query("SELECT points FROM students WHERE id = $studentId")->fetch(PDO::FETCH_ASSOC);
    $txRow = $conn->query("SELECT * FROM wallet_transactions WHERE service_request_id = $reqId")->fetch(PDO::FETCH_ASSOC);
    
    if ($reqRow['payment_method'] === 'cash' && (int)$reqRow['service_price_points'] === 75 && (int)$reqRow['points_charged'] === 0 && $reqRow['status'] === 'pending_cash') {
        echo "  [PASS] Request inserted correctly with status=pending_cash, payment_method=cash, price=75, charged=0\n";
    } else {
        echo "  [FAIL] DB row mismatch: " . print_r($reqRow, true) . "\n";
    }
    
    if ((int)$stdRow['points'] === 125) {
        echo "  [PASS] Student balance remained unaffected (125 points)\n";
    } else {
        echo "  [FAIL] Student balance is " . $stdRow['points'] . " instead of 125\n";
    }
    
    if (!$txRow) {
        echo "  [PASS] No wallet transaction created for cash request\n";
    } else {
        echo "  [FAIL] Wallet transaction was created for cash request: " . print_r($txRow, true) . "\n";
    }
    
    // Check chat message content
    if ($textMsgId) {
        $chatMsg = $conn->query("SELECT text FROM chat_messages WHERE id = $textMsgId")->fetch(PDO::FETCH_ASSOC);
        if ($chatMsg && strpos($chatMsg['text'], 'طريقة الدفع: نقدًا عند تنفيذ الخدمة') !== false) {
            echo "  [PASS] Chat message text correctly states cash payment info\n";
        } else {
            echo "  [FAIL] Chat message text mismatch: " . ($chatMsg['text'] ?? 'NULL') . "\n";
        }
    } else {
        echo "  [FAIL] Text message ID is missing\n";
    }
} else {
    echo "  [FAIL] Paid cash service failed: code=" . $res3['code'] . ", body=" . $res3['body'] . "\n";
}
echo "\n";


// ==========================================
// TEST 4: Missing payment_method for paid service
// ==========================================
echo "Test 4: Missing payment_method for paid service...\n";
$res4 = sendPost($baseUrl, [
    'service_id' => $paidSvcId,
    'details' => 'Missing payment method details',
    'request_uuid' => 'uuid-missing-1'
], $token);

if ($res4['code'] === 400 && $res4['json']['status'] === 'error') {
    echo "  [PASS] Correctly failed with HTTP 400 and JSON error response\n";
    if (strpos($res4['json']['message'], 'طريقة الدفع') !== false) {
        echo "  [PASS] Error message was user-friendly validation message\n";
    } else {
        echo "  [FAIL] Unexpected error message: " . $res4['json']['message'] . "\n";
    }
} else {
    echo "  [FAIL] Expected failure, got code=" . $res4['code'] . ", body=" . $res4['body'] . "\n";
}
echo "\n";


// ==========================================
// TEST 5: Invalid payment_method
// ==========================================
echo "Test 5: Invalid payment_method...\n";
$res5 = sendPost($baseUrl, [
    'service_id' => $paidSvcId,
    'payment_method' => 'invalid_method',
    'details' => 'Invalid payment method details',
    'request_uuid' => 'uuid-invalid-1'
], $token);

if ($res5['code'] === 400 && $res5['json']['status'] === 'error') {
    echo "  [PASS] Correctly failed with HTTP 400 and JSON error response\n";
} else {
    echo "  [FAIL] Expected failure, got code=" . $res5['code'] . ", body=" . $res5['body'] . "\n";
}
echo "\n";


// ==========================================
// TEST 6: Duplicate request_uuid for cash
// ==========================================
echo "Test 6: Duplicate request_uuid for cash...\n";
$uuid = 'uuid-dup-cash-' . uniqid();
$res6a = sendPost($baseUrl, [
    'service_id' => $paidSvcId,
    'payment_method' => 'cash',
    'details' => 'Duplicate cash details 1',
    'request_uuid' => $uuid
], $token);

$res6b = sendPost($baseUrl, [
    'service_id' => $paidSvcId,
    'payment_method' => 'cash',
    'details' => 'Duplicate cash details 2',
    'request_uuid' => $uuid
], $token);

if ($res6a['code'] === 200 && $res6b['code'] === 200) {
    $idA = $res6a['json']['data']['request_id'];
    $idB = $res6b['json']['data']['request_id'];
    if ($idA === $idB) {
        echo "  [PASS] Idempotent duplicate check replayed request successfully, returned same ID ($idA)\n";
    } else {
        echo "  [FAIL] Different request IDs returned for same UUID: A=$idA, B=$idB\n";
    }
} else {
    echo "  [FAIL] Duplicate requests failed: A=" . $res6a['body'] . ", B=" . $res6b['body'] . "\n";
}
echo "\n";


// ==========================================
// TEST 7: Image message insert failure rollback
// ==========================================
echo "Test 7: Image message insert failure rollback...\n";

// Let's check requests count before
$beforeCount = (int)$conn->query("SELECT COUNT(*) FROM service_requests")->fetchColumn();

// Send request with simulation parameter to trigger rollback error
$res7 = sendPost($baseUrl, [
    'service_id' => $paidSvcId,
    'payment_method' => 'wallet',
    'details' => 'Rollback check details [رابط الصورة المرفقة: uploads/rollback.jpg]',
    'request_uuid' => 'uuid-rollback-1',
    'test_simulate_image_fail' => true
], $token);

// Let's check requests count after
$afterCount = (int)$conn->query("SELECT COUNT(*) FROM service_requests")->fetchColumn();
$stdPointsAfter = (int)$conn->query("SELECT points FROM students WHERE id = $studentId")->fetchColumn();

if ($res7['code'] === 500 && $res7['json']['status'] === 'error') {
    echo "  [PASS] Server returned HTTP 500 with valid error JSON due to simulated failure\n";
} else {
    echo "  [FAIL] Server did not throw 500. Result: code=" . $res7['code'] . ", body=" . $res7['body'] . "\n";
}

if ($beforeCount === $afterCount) {
    echo "  [PASS] Database transaction rolled back successfully. Request count did not increase.\n";
} else {
    echo "  [FAIL] Database transaction DID NOT roll back. Request was created despite image insertion failure!\n";
}

// Points check: wallet points deduction should also be rolled back (balance should still be 125, not 50!)
if ($stdPointsAfter === 125) {
    echo "  [PASS] Wallet deduction rolled back successfully (points balance remained at 125)\n";
} else {
    echo "  [FAIL] Wallet points deducted but not rolled back! Points balance is $stdPointsAfter\n";
}
echo "\n";


// ==========================================
// TEST 8: Cash creates no wallet transaction
// ==========================================
echo "Test 8: Cash creates no wallet transaction check...\n";
$reqCashId = $res3['json']['data']['request_id'] ?? null;
if ($reqCashId) {
    $txCheck = $conn->query("SELECT COUNT(*) FROM wallet_transactions WHERE service_request_id = $reqCashId")->fetchColumn();
    if ((int)$txCheck === 0) {
        echo "  [PASS] Verified 0 wallet transactions exist for cash request ID $reqCashId\n";
    } else {
        echo "  [FAIL] Wallet transaction exists for cash request ID $reqCashId\n";
    }
} else {
    echo "  [FAIL] Could not run test 8 because cash request ID was not captured\n";
}
echo "\n";


// Clean up test data
$conn->query("DELETE FROM students WHERE email = 'test_pay@example.com'");
$conn->query("DELETE FROM services WHERE title IN ('Test Free Service', 'Test Paid Service')");

echo "=== INTEGRATION TESTS COMPLETED ===\n";
