<?php
// Disable HTML error output to client and log internally
ini_set('display_errors', '0');
ini_set('log_errors', '1');

// Global error handler to convert non-fatal errors to exceptions
set_error_handler(function($severity, $message, $file, $line) {
    if (!(error_reporting() & $severity)) {
        return;
    }
    throw new ErrorException($message, 0, $severity, $file, $line);
});

// Global exception handler to output clean JSON
set_exception_handler(function($e) {
    error_log("Unhandled Exception in student_requests.php: " . $e->getMessage() . " in " . $e->getFile() . " on line " . $e->getLine());
    while (ob_get_level() > 0) {
        ob_end_clean();
    }
    http_response_code(500);
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode([
        "status" => "error",
        "message" => "حدث خطأ داخلي في الخادم: " . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
    exit();
});

// ملف استقبال طلبات الطلاب والحجوزات (Service & Booking Requests API)
require_once __DIR__ . '/../config/db_staging.php';
require_once __DIR__ . '/middleware/auth.php';
require_once __DIR__ . '/core/notification.php';

$rawInput = file_get_contents("php://input");
if (empty($rawInput) && php_sapi_name() === 'cli') {
    $rawInput = file_get_contents("php://stdin");
}
$input = json_decode($rawInput, true) ?? $_POST;
$action = $_GET['action'] ?? ($input['action'] ?? 'submit');

if ($action === 'get_news') {
    try {
        $lang = $_GET['lang'] ?? 'ar';
        if (!in_array($lang, ['ar', 'en'], true)) {
            $lang = 'ar';
        }
        $titleCol = ($lang === 'en') ? "COALESCE(NULLIF(title_en, ''), NULLIF(title_ar, ''), title)" : "COALESCE(NULLIF(title_ar, ''), title)";
        $contentCol = ($lang === 'en') ? "COALESCE(NULLIF(content_en, ''), NULLIF(content_ar, ''), content)" : "COALESCE(NULLIF(content_ar, ''), content)";
        
        $stmt = $conn->query("SELECT id, $titleCol AS title, $contentCol AS content, image_url, DATE_FORMAT(created_at,'%Y-%m-%d %h:%i %p') AS date FROM news ORDER BY created_at DESC LIMIT 30");
        $news = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(["status" => "success", "news" => $news], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        echo json_encode(["status" => "success", "news" => []], JSON_UNESCAPED_UNICODE);
    }
    exit();
}

if ($action === 'get_notifications') {
    try {
        $studentId = 0;
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
        if (!empty($authHeader) && preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            $token = $matches[1];
            $payload = JWT::decode($token);
            if ($payload && isset($payload['student_id'])) {
                $studentId = intval($payload['student_id']);
            }
        }

        $studentCreatedAt = null;
        if ($studentId > 0) {
            $sStmt = $conn->prepare("SELECT created_at FROM students WHERE id = ? LIMIT 1");
            $sStmt->execute([$studentId]);
            $studentCreatedAt = $sStmt->fetchColumn();
        }

        if ($studentCreatedAt) {
            // For registered students: only show direct notifications or broadcasts created AFTER their registration
            $stmt = $conn->prepare("SELECT id, student_id, title, body as content,
                                           COALESCE(NULLIF(title_ar, ''), title) AS title_ar,
                                           COALESCE(NULLIF(title_en, ''), title) AS title_en,
                                           COALESCE(NULLIF(body_ar, ''), body) AS body_ar,
                                           COALESCE(NULLIF(body_en, ''), body) AS body_en,
                                           created_at as date 
                                    FROM notifications 
                                    WHERE student_id = ? OR (student_id = 0 AND created_at >= ?)
                                    ORDER BY created_at DESC 
                                    LIMIT 50");
            $stmt->execute([$studentId, $studentCreatedAt]);
        } else {
            // For guest users: only recent broadcast notifications within the last 24 hours
            $stmt = $conn->prepare("SELECT id, student_id, title, body as content,
                                           COALESCE(NULLIF(title_ar, ''), title) AS title_ar,
                                           COALESCE(NULLIF(title_en, ''), title) AS title_en,
                                           COALESCE(NULLIF(body_ar, ''), body) AS body_ar,
                                           COALESCE(NULLIF(body_en, ''), body) AS body_en,
                                           created_at as date 
                                    FROM notifications 
                                    WHERE student_id = 0 AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
                                    ORDER BY created_at DESC 
                                    LIMIT 50");
            $stmt->execute();
        }
        $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(["status" => "success", "notifications" => $notifications], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        echo json_encode(["status" => "success", "notifications" => []], JSON_UNESCAPED_UNICODE);
    }
    exit();
}

if ($action === 'list') {
    // Requires authenticated student
    if (!AuthMiddleware::requireAnyAuth()) {
        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "تسجيل الدخول مطلوب"], JSON_UNESCAPED_UNICODE);
        exit();
    }
    $studentId = AuthMiddleware::$currentUserId;
    try {
        $stmt = $conn->prepare("SELECT id, service_id, service_title, status, created_at FROM service_requests WHERE student_id = ? ORDER BY id DESC");
        $stmt->execute([$studentId]);
        $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(["status" => "success", "data" => ["requests" => $requests]], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "خطأ في قاعدة البيانات: " . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
    exit();
}

if ($action === 'submit') {
    // Attempt JWT student authentication if token header present, fallback to optional input
    $studentId = null;
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if (!empty($authHeader) && preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        try {
            if (AuthMiddleware::requireAnyAuth()) {
                $studentId = AuthMiddleware::$currentUserId;
            }
        } catch (Throwable $e) {
            // Unauthenticated fallback
        }
    }
    if (!$studentId && !empty($input['student_id'])) {
        $studentId = intval($input['student_id']);
    }

    $studentName = trim($input['student_name'] ?? '');
    $studentPhone = trim($input['student_phone'] ?? '');
    $universityId = isset($input['university_id']) ? intval($input['university_id']) : 0;

    // Resolve university name according to strict fallback order:
    // 1. Valid submitted university_id resolved from universities table.
    // 2. Authenticated student's university from students table.
    // 3. Arabic empty state.
    $resolvedUni = '';
    if ($universityId > 0) {
        try {
            $uniStmt = $conn->prepare("SELECT name FROM universities WHERE id = ?");
            $uniStmt->execute([$universityId]);
            $uniRow = $uniStmt->fetch(PDO::FETCH_ASSOC);
            if ($uniRow && !empty($uniRow['name'])) {
                $resolvedUni = trim($uniRow['name']);
            }
        } catch (Throwable $e) {
            // Ignore DB resolution errors
        }
    }

    if (empty($resolvedUni) || strtolower($resolvedUni) === 'null') {
        if ($studentId > 0) {
            try {
                $stdQuery = $conn->prepare("SELECT university FROM students WHERE id = ?");
                $stdQuery->execute([$studentId]);
                $studentDbRow = $stdQuery->fetch(PDO::FETCH_ASSOC);
                if ($studentDbRow && !empty($studentDbRow['university'])) {
                    $resolvedUni = trim($studentDbRow['university']);
                }
            } catch (Throwable $e) {
                // Ignore DB errors
            }
        }
    }

    if (empty($resolvedUni) || strtolower($resolvedUni) === 'null') {
        $resolvedUni = 'جامعة غير محددة';
    }
    $studentUni = $resolvedUni;

    $serviceTitle = trim($input['service_title'] ?? '');
    $details = trim($input['details'] ?? '');
    $requestUuid = trim($input['request_uuid'] ?? '');

    if ($studentId) {
        try {
            $stdQuery = $conn->prepare("SELECT full_name, phone FROM students WHERE id = ?");
            $stdQuery->execute([$studentId]);
            $studentDbRow = $stdQuery->fetch(PDO::FETCH_ASSOC);
            if ($studentDbRow) {
                if (empty($studentName)) {
                    $studentName = $studentDbRow['full_name'];
                }
                if (empty($studentPhone)) {
                    $studentPhone = $studentDbRow['phone'];
                }
            }
        } catch (Throwable $e) {
            // Ignore DB lookup errors here
        }
    }

    if (empty($studentName)) {
        $studentName = 'طالب أبشر';
    }
    if (empty($serviceTitle)) {
        $serviceTitle = 'طلب خدمة';
    }

    if (empty($details)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "تفاصيل الطلب مطلوبة"], JSON_UNESCAPED_UNICODE);
        exit();
    }

    // 1. Idempotency Check BEFORE Starting Transaction (Clean exit, no rollback)
    if (!empty($requestUuid)) {
        try {
            $dupStmt = $conn->prepare("SELECT id, service_id, service_price_points, points_charged, payment_method FROM service_requests WHERE request_uuid = ? LIMIT 1");
            $dupStmt->execute([$requestUuid]);
            $dupRow = $dupStmt->fetch(PDO::FETCH_ASSOC);
            if ($dupRow) {
                $origRequestId = (int)$dupRow['id'];
                $pointsCharged = (int)$dupRow['points_charged'];
                $servicePricePoints = (int)$dupRow['service_price_points'];
                $paymentMethod = $dupRow['payment_method'];
                $serviceId = $dupRow['service_id'] ? (int)$dupRow['service_id'] : null;

                // Resolve current balance
                $balanceAfter = 0;
                $txId = null;
                if ($studentId) {
                    $stdStmt = $conn->prepare("SELECT points FROM students WHERE id = ? LIMIT 1");
                    $stdStmt->execute([$studentId]);
                    $stdRow = $stdStmt->fetch(PDO::FETCH_ASSOC);
                    $balanceAfter = $stdRow ? (int)$stdRow['points'] : 0;
                    
                    if ($pointsCharged > 0) {
                        $txStmt = $conn->prepare("SELECT id FROM wallet_transactions WHERE service_request_id = ? LIMIT 1");
                        $txStmt->execute([$origRequestId]);
                        $txRow = $txStmt->fetch(PDO::FETCH_ASSOC);
                        $txId = $txRow ? (int)$txRow['id'] : null;
                    }
                }

                // Resolve chat details
                $chatId = null;
                $textMsgId = null;
                $imgMsgId = null;
                if ($studentId) {
                    $chatStmt = $conn->prepare("SELECT id FROM chats WHERE student_id = ? AND status != 'archived' ORDER BY updated_at DESC LIMIT 1");
                    $chatStmt->execute([$studentId]);
                    $chatRow = $chatStmt->fetch(PDO::FETCH_ASSOC);
                    $chatId = $chatRow ? (int)$chatRow['id'] : null;
                    
                    if ($chatId) {
                        // Find text message
                        $tStmt = $conn->prepare("SELECT id FROM chat_messages WHERE chat_id = ? AND text LIKE ? AND type = 'text' ORDER BY id DESC LIMIT 1");
                        $tStmt->execute([$chatId, "%#$origRequestId%"]);
                        $tRow = $tStmt->fetch(PDO::FETCH_ASSOC);
                        $textMsgId = $tRow ? (int)$tRow['id'] : null;

                        // Find image message
                        $iStmt = $conn->prepare("SELECT id FROM chat_messages WHERE chat_id = ? AND text LIKE ? AND type = 'image' ORDER BY id DESC LIMIT 1");
                        $iStmt->execute([$chatId, "%#$origRequestId%"]);
                        $iRow = $iStmt->fetch(PDO::FETCH_ASSOC);
                        $imgMsgId = $iRow ? (int)$iRow['id'] : null;
                    }
                }

                echo json_encode([
                    "status" => "success",
                    "message" => "تم استلام الطلب مسبقاً بنجاح.",
                    "data" => [
                        "request_id" => $origRequestId,
                        "service_id" => $serviceId,
                        "service_price_points" => $servicePricePoints,
                        "points_charged" => $pointsCharged,
                        "payment_method" => $paymentMethod,
                        "balance_before" => $balanceAfter,
                        "balance_after" => $balanceAfter,
                        "wallet_transaction_id" => $txId,
                        "chat_id" => $chatId,
                        "chat_text_message_id" => $textMsgId,
                        "chat_image_message_id" => $imgMsgId
                    ]
                ], JSON_UNESCAPED_UNICODE);
                exit();
            }
        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "فشل التحقق من تكرار الطلب: " . $e->getMessage()], JSON_UNESCAPED_UNICODE);
            exit();
        }
    }

    try {
        $conn->beginTransaction();

        // 2. Service lookup & canonical price resolution
        $serviceId = isset($input['service_id']) ? intval($input['service_id']) : 0;
        $pricePoints = 0;

        if ($serviceId > 0) {
            $svcStmt = $conn->prepare("SELECT title, price_points FROM services WHERE id = ?");
            $svcStmt->execute([$serviceId]);
            $serviceRow = $svcStmt->fetch(PDO::FETCH_ASSOC);
            if (!$serviceRow) {
                throw new Exception("الخدمة المطلوبة غير موجودة في النظام.");
            }
            $serviceTitle = $serviceRow['title'];
            $pricePoints = (int)$serviceRow['price_points'];
        } else {
            // Fallback for legacy requests (e.g. roommate match requests by title)
            $svcStmt = $conn->prepare("SELECT id, title, price_points FROM services WHERE title = ? LIMIT 1");
            $svcStmt->execute([$serviceTitle]);
            $serviceRow = $svcStmt->fetch(PDO::FETCH_ASSOC);
            if ($serviceRow) {
                $serviceId = (int)$serviceRow['id'];
                $pricePoints = (int)$serviceRow['price_points'];
            }
        }

        // 3. Paid-service behavior & validations
        $promoCodeInput = !empty($input['promo_code']) ? strtoupper(trim($input['promo_code'])) : '';
        $promoRow = null;
        $promoCodeId = null;
        $discountPoints = 0;
        $finalPricePoints = $pricePoints;

        if ($pricePoints > 0) {
            if ($serviceId <= 0) {
                throw new Exception("معرف الخدمة (service_id) مطلوب للخدمات المدفوعة.");
            }
            
            $paymentMethodInput = trim($input['payment_method'] ?? '');
            if (empty($paymentMethodInput)) {
                throw new Exception("يرجى تحديد طريقة الدفع للخدمة المدفوعة (محفظة أو نقداً).");
            }
            if ($paymentMethodInput !== 'wallet' && $paymentMethodInput !== 'cash') {
                throw new Exception("طريقة الدفع غير صالحة. يرجى اختيار المحفظة أو الدفع نقداً.");
            }
            $paymentMethod = $paymentMethodInput;
            $payWithPoints = ($paymentMethod === 'wallet');
        } else {
            $paymentMethod = 'free';
            $payWithPoints = false;
            $pricePoints = 0;
            $finalPricePoints = 0;
        }

        // Promo Code is Wallet-Only
        if (!empty($promoCodeInput)) {
            if ($paymentMethod !== 'wallet') {
                throw new Exception("كود الخصم متاح عند الدفع بنقاط المحفظة فقط.");
            }
            if (!$studentId) {
                throw new Exception("تسجيل الدخول مطلوب للاستفادة من كود الخصم.");
            }

            // Lock student row early to serialize concurrent requests by the same student
            $stdLock = $conn->prepare("SELECT points FROM students WHERE id = ? FOR UPDATE");
            $stdLock->execute([$studentId]);
            $stdLockRow = $stdLock->fetch(PDO::FETCH_ASSOC);
            if (!$stdLockRow) {
                throw new Exception("لم يتم العثور على حساب الطالب.");
            }
            $balanceBefore = (int)$stdLockRow['points'];
            $balanceAfter = $balanceBefore;

            // Lock promo code row for update to serialize global usage
            $pStmt = $conn->prepare("SELECT * FROM promo_codes WHERE code = ? FOR UPDATE");
            $pStmt->execute([$promoCodeInput]);
            $promoRow = $pStmt->fetch(PDO::FETCH_ASSOC);

            if (!$promoRow || $promoRow['status'] === 'archived') {
                throw new Exception("كود الخصم غير موجود أو غير صحيح.");
            }
            if ($promoRow['status'] === 'paused') {
                throw new Exception("كود الخصم معطل حالياً.");
            }

            $now = date('Y-m-d H:i:s');
            if (!empty($promoRow['start_at']) && $now < $promoRow['start_at']) {
                throw new Exception("كود الخصم لم يبدأ بعد.");
            }
            if (!empty($promoRow['expires_at']) && $now > $promoRow['expires_at']) {
                throw new Exception("كود الخصم منتهي الصلاحية.");
            }

            if ($promoRow['service_scope'] === 'selected') {
                $scStmt = $conn->prepare("SELECT 1 FROM promo_code_services WHERE promo_code_id = ? AND service_id = ?");
                $scStmt->execute([$promoRow['id'], $serviceId]);
                if (!$scStmt->fetch()) {
                    throw new Exception("كود الخصم غير متاح للخدمة المحددة.");
                }
            }

            if ($promoRow['audience_scope'] === 'selected') {
                $auStmt = $conn->prepare("SELECT 1 FROM promo_code_students WHERE promo_code_id = ? AND student_id = ?");
                $auStmt->execute([$promoRow['id'], $studentId]);
                if (!$auStmt->fetch()) {
                    throw new Exception("كود الخصم غير صحيح أو غير مخصص لحسابك.");
                }
            }

            $minPrice = intval($promoRow['min_service_price_points'] ?? 0);
            if ($minPrice > 0 && $pricePoints < $minPrice) {
                throw new Exception("سعر الخدمة أقل من الحد الأدنى لتطبيق كود الخصم.");
            }

            if ($promoRow['total_usage_limit'] !== null) {
                if (intval($promoRow['used_count']) >= intval($promoRow['total_usage_limit'])) {
                    throw new Exception("تم استنفاد الحد الأقصى لاستخدام كود الخصم.");
                }
            }

            if (!empty($promoRow['per_student_limit'])) {
                $stdCntStmt = $conn->prepare("SELECT COUNT(*) FROM promo_code_redemptions WHERE promo_code_id = ? AND student_id = ? AND status = 'applied' LOCK IN SHARE MODE");
                $stdCntStmt->execute([$promoRow['id'], $studentId]);
                if (intval($stdCntStmt->fetchColumn()) >= intval($promoRow['per_student_limit'])) {
                    throw new Exception("لقد تجاوزت الحد الأقصى المسموح لك لاستخدام هذا الكود.");
                }
            }

            // Calculate Discount
            $dType = $promoRow['discount_type'];
            $dVal = floatval($promoRow['discount_value']);
            $maxD = !empty($promoRow['max_discount_points']) ? intval($promoRow['max_discount_points']) : null;

            if ($dType === 'percentage') {
                $rawD = $pricePoints * ($dVal / 100.0);
                $discountPoints = (int)floor($rawD);
                if ($discountPoints === 0 && $pricePoints > 0) {
                    $discountPoints = 1;
                }
                if ($maxD !== null && $maxD > 0) {
                    $discountPoints = min($discountPoints, $maxD);
                }
            } else if ($dType === 'fixed') {
                $discountPoints = min((int)$dVal, $pricePoints);
            } else if ($dType === 'free') {
                $discountPoints = $pricePoints;
            }

            $discountPoints = min($discountPoints, $pricePoints);
            $finalPricePoints = max(0, $pricePoints - $discountPoints);
            $promoCodeId = intval($promoRow['id']);

            // Increment usage counter
            $conn->prepare("UPDATE promo_codes SET used_count = used_count + 1 WHERE id = ?")->execute([$promoCodeId]);
        }

        if ($payWithPoints && !$studentId) {
            throw new Exception("تسجيل الدخول مطلوب لإتمام هذا الطلب.");
        }

        $balanceBefore = 0;
        $balanceAfter = 0;
        $walletTxId = null;

        if ($studentId) {
            $stdStmt = $conn->prepare("SELECT points FROM students WHERE id = ?");
            $stdStmt->execute([$studentId]);
            $stdRow = $stdStmt->fetch(PDO::FETCH_ASSOC);
            $balanceBefore = $stdRow ? (int)$stdRow['points'] : 0;
            $balanceAfter = $balanceBefore;
        }

        // 4. Points deduction & wallet lock
        $pointsCharged = 0;
        if ($payWithPoints && $finalPricePoints > 0) {
            $ptsStmt = $conn->prepare("SELECT points FROM students WHERE id = ? FOR UPDATE");
            $ptsStmt->execute([$studentId]);
            $ptsRow = $ptsStmt->fetch(PDO::FETCH_ASSOC);
            if (!$ptsRow) {
                throw new Exception("لم يتم العثور على حساب الطالب.");
            }
            $currentPoints = (int)$ptsRow['points'];
            $balanceBefore = $currentPoints;
            if ($currentPoints < $finalPricePoints) {
                throw new Exception("رصيد النقاط غير كافٍ لإكمال هذه العملية.");
            }

            $deductStmt = $conn->prepare("UPDATE students SET points = points - ? WHERE id = ? AND points >= ?");
            $deductStmt->execute([$finalPricePoints, $studentId, $finalPricePoints]);
            if ($deductStmt->rowCount() === 0) {
                throw new Exception("فشلت عملية خصم النقاط.");
            }
            $balanceAfter = $balanceBefore - $finalPricePoints;
            $pointsCharged = $finalPricePoints;
        }

        // 5. Request insert (using machine status values)
        $status = ($paymentMethod === 'cash') ? 'pending_cash' : 'قيد المراجعة';
        $stmt = $conn->prepare("INSERT INTO service_requests (student_id, service_id, promo_code_id, service_price_points, discount_points, final_price_points, points_charged, payment_method, request_uuid, student_name, student_phone, service_title, details, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())");
        $fullDetails = "الجامعة: " . $studentUni . "\nالتفاصيل: " . $details;
        $stmt->execute([$studentId, $serviceId ?: null, $promoCodeId ?: null, $pricePoints, $discountPoints, $finalPricePoints, $pointsCharged, $paymentMethod, $requestUuid ?: null, $studentName, $studentPhone, $serviceTitle, $fullDetails, $status]);
        $requestId = $conn->lastInsertId();

        // 6. Record Promo Redemption Snapshot
        if ($promoRow && $promoCodeId) {
            $stdSnapStmt = $conn->prepare("SELECT full_name, phone, email FROM students WHERE id = ?");
            $stdSnapStmt->execute([$studentId]);
            $stdSnap = $stdSnapStmt->fetch(PDO::FETCH_ASSOC) ?: [];

            $redempStmt = $conn->prepare("
                INSERT INTO promo_code_redemptions (
                    promo_code_id, service_request_id, request_id_snapshot, student_id,
                    student_name_snapshot, student_phone_snapshot, student_email_snapshot,
                    service_id, service_title_snapshot, code_snapshot, campaign_snapshot,
                    discount_type_snapshot, discount_value_snapshot, original_price_points,
                    discount_points, final_price_points, payment_method, status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'wallet', 'applied', NOW())
            ");
            $redempStmt->execute([
                $promoCodeId,
                $requestId,
                $requestId,
                $studentId,
                $stdSnap['full_name'] ?? $studentName,
                $stdSnap['phone'] ?? $studentPhone,
                $stdSnap['email'] ?? '',
                $serviceId ?: null,
                $serviceTitle,
                $promoRow['code'],
                $promoRow['campaign_name'],
                $promoRow['discount_type'],
                $promoRow['discount_value'],
                $pricePoints,
                $discountPoints,
                $finalPricePoints
            ]);
        }

        // 7. Wallet transaction insert (with UNIQUE composite constraint)
        if ($payWithPoints && $pointsCharged > 0) {
            $txDesc = "خصم لطلب خدمة: " . $serviceTitle;
            if ($discountPoints > 0) {
                $txDesc .= " (بعد خصم $discountPoints نقطة)";
            }
            $txStmt = $conn->prepare("INSERT INTO wallet_transactions (student_id, service_request_id, amount, type, description, created_at) VALUES (?, ?, ?, 'خصم', ?, NOW())");
            $txStmt->execute([$studentId, $requestId, $pointsCharged, $txDesc]);
            $walletTxId = $conn->lastInsertId();

            // Notification insert
            $notifTitle = "سحب نقاط";
            $notifBody = "تم خصم $pointsCharged نقطة من محفظتك لطلب الخدمة: $serviceTitle";
            sendStudentNotification($studentId, $notifTitle, $notifBody);
        }

        // 8. Chat support sync
        $chatId = null;
        $textMsgId = null;
        $imgMsgId = null;
        if ($studentId > 0) {
            $chatStmt = $conn->prepare("SELECT id FROM chats WHERE student_id = ? AND status != 'archived' ORDER BY updated_at DESC LIMIT 1");
            $chatStmt->execute([$studentId]);
            $chatRow = $chatStmt->fetch(PDO::FETCH_ASSOC);
            $chatId = $chatRow ? (int)$chatRow['id'] : null;

            if (!$chatId) {
                // Check if chat exists with the same phone
                $phoneChatStmt = $conn->prepare("SELECT id FROM chats WHERE phone = ? LIMIT 1");
                $phoneChatStmt->execute([$studentPhone]);
                $phoneChatRow = $phoneChatStmt->fetch(PDO::FETCH_ASSOC);
                if ($phoneChatRow) {
                    $chatId = (int)$phoneChatRow['id'];
                    $conn->prepare("UPDATE chats SET student_id = ? WHERE id = ?")->execute([$studentId, $chatId]);
                } else {
                    $createChat = $conn->prepare("INSERT INTO chats (student_id, student_name, student_uni, phone, last_msg, status, updated_at) VALUES (?, ?, ?, ?, '', 'رسالة جديدة 🔔', NOW())");
                    $createChat->execute([$studentId, $studentName, $studentUni, $studentPhone]);
                    $chatId = (int)$conn->lastInsertId();
                }
            }

            if ($chatId) {
                $headerTitle = ($paymentMethod === 'wallet') ? "📋 [طلب مدفوع بالنقاط - #$requestId]" : "📋 [طلب خدمة جديد - #$requestId]";
                $msgLines = [$headerTitle, "الخدمة: " . $serviceTitle];
                if (!empty($studentUni) && strpos($fullDetails, 'الجامعة') === false) {
                    $msgLines[] = "الجامعة: " . $studentUni;
                }
                $msgLines[] = $fullDetails;
                if ($paymentMethod === 'wallet' && strpos($fullDetails, 'خصم') === false && $pointsCharged > 0) {
                    $msgLines[] = "[تم خصم $pointsCharged نقطة بنجاح]";
                } else if ($paymentMethod === 'cash' && strpos($fullDetails, 'طريقة الدفع') === false && strpos($fullDetails, 'الدفع') === false) {
                    $msgLines[] = "[طريقة الدفع: نقدًا عند تنفيذ الخدمة]";
                }
                $msgContent = implode("\n", array_filter($msgLines));

                $attachedImageUrl = '';
                // Check if details contains a photo link using ASCII-safe uploads path regex
                if (preg_match('/\[[^\]]*?(uploads\/[a-zA-Z0-9_\/.-]+)\]/', $fullDetails, $imgMatches)) {
                    $attachedImageUrl = trim($imgMatches[1]);
                    // Clean up the text version of the message by removing the bracketed link
                    $msgContent = str_replace($imgMatches[0], '', $msgContent);
                    $msgContent = trim($msgContent);
                }

                // 1. Insert Text Message
                $msgStmt = $conn->prepare("INSERT INTO chat_messages (chat_id, sender, type, text, created_at) VALUES (?, 'student', 'text', ?, NOW())");
                $msgStmt->execute([$chatId, $msgContent]);
                $textMsgId = $conn->lastInsertId();
                $lastMsgString = $msgContent;

                // 2. Insert Image Message if image is attached
                if (!empty($attachedImageUrl)) {
                    $imgCaption = "🖼️ صورة مرفقة بالطلب #" . $requestId;
                    $imgStmt = $conn->prepare("INSERT INTO chat_messages (chat_id, sender, type, text, image_url, created_at) VALUES (?, 'student', 'image', ?, ?, NOW())");
                    $imgStmt->execute([$chatId, $imgCaption, $attachedImageUrl]);
                    $imgMsgId = $conn->lastInsertId();
                    $lastMsgString = $imgCaption;
                }

                // 3. Update Chat last_msg and trigger notification flag
                $updateChat = $conn->prepare("UPDATE chats SET last_msg = ?, status = 'رسالة جديدة 🔔', updated_at = NOW() WHERE id = ?");
                $updateChat->execute([$lastMsgString, $chatId]);
            }
        }

        // [TEST ONLY] Simulate image/chat message insert failure right before committing
        if (!empty($input['test_simulate_image_fail'])) {
            throw new Exception("Simulated image insert failure for transaction rollback testing.");
        }

        $conn->commit();

        echo json_encode([
            "status" => "success",
            "message" => "تم استلام الطلب بنجاح وسيتواصل معك الدعم الفني قريباً.",
            "data" => [
                "request_id" => (int)$requestId,
                "service_id" => $serviceId ?: null,
                "service_price_points" => $pricePoints,
                "points_charged" => $pointsCharged,
                "payment_method" => $paymentMethod,
                "balance_before" => $balanceBefore,
                "balance_after" => $balanceAfter,
                "wallet_transaction_id" => $walletTxId ? (int)$walletTxId : null,
                "chat_id" => $chatId ? (int)$chatId : null,
                "chat_text_message_id" => $textMsgId ? (int)$textMsgId : null,
                "chat_image_message_id" => $imgMsgId ? (int)$imgMsgId : null
            ]
        ], JSON_UNESCAPED_UNICODE);

    } catch (Throwable $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }

        // Handle concurrent duplicate request_uuid database violations as successful idempotent replay
        $isDuplicateKey = false;
        if (!empty($requestUuid)) {
            $msg = $e->getMessage();
            if (strpos($msg, '1062') !== false || strpos($msg, '23000') !== false || $e->getCode() == 23000 || $e->getCode() == 1062) {
                $isDuplicateKey = true;
            }
        }

        if ($isDuplicateKey) {
            try {
                $dupStmt = $conn->prepare("SELECT id, service_id, service_price_points, points_charged, payment_method FROM service_requests WHERE request_uuid = ? LIMIT 1");
                $dupStmt->execute([$requestUuid]);
                $dupRow = $dupStmt->fetch(PDO::FETCH_ASSOC);
                if ($dupRow) {
                    $origRequestId = (int)$dupRow['id'];
                    $pointsCharged = (int)$dupRow['points_charged'];
                    $servicePricePoints = (int)$dupRow['service_price_points'];
                    $paymentMethod = $dupRow['payment_method'];
                    $serviceId = $dupRow['service_id'] ? (int)$dupRow['service_id'] : null;

                    // Resolve current balance
                    $balanceAfter = 0;
                    if ($studentId) {
                        $stdStmt = $conn->prepare("SELECT points FROM students WHERE id = ? LIMIT 1");
                        $stdStmt->execute([$studentId]);
                        $stdRow = $stdStmt->fetch(PDO::FETCH_ASSOC);
                        $balanceAfter = $stdRow ? (int)$stdRow['points'] : 0;
                    }

                    // Resolve transaction ID
                    $txId = null;
                    if ($pointsCharged > 0) {
                        $txStmt = $conn->prepare("SELECT id FROM wallet_transactions WHERE service_request_id = ? LIMIT 1");
                        $txStmt->execute([$origRequestId]);
                        $txRow = $txStmt->fetch(PDO::FETCH_ASSOC);
                        $txId = $txRow ? (int)$txRow['id'] : null;
                    }

                    // Resolve chat details
                    $chatId = null;
                    $textMsgId = null;
                    $imgMsgId = null;
                    if ($studentId) {
                        $chatStmt = $conn->prepare("SELECT id FROM chats WHERE student_id = ? AND status != 'archived' ORDER BY updated_at DESC LIMIT 1");
                        $chatStmt->execute([$studentId]);
                        $chatRow = $chatStmt->fetch(PDO::FETCH_ASSOC);
                        $chatId = $chatRow ? (int)$chatRow['id'] : null;
                        
                        if ($chatId) {
                            $tStmt = $conn->prepare("SELECT id FROM chat_messages WHERE chat_id = ? AND text LIKE ? AND type = 'text' ORDER BY id DESC LIMIT 1");
                            $tStmt->execute([$chatId, "%#$origRequestId%"]);
                            $tRow = $tStmt->fetch(PDO::FETCH_ASSOC);
                            $textMsgId = $tRow ? (int)$tRow['id'] : null;

                            $iStmt = $conn->prepare("SELECT id FROM chat_messages WHERE chat_id = ? AND text LIKE ? AND type = 'image' ORDER BY id DESC LIMIT 1");
                            $iStmt->execute([$chatId, "%#$origRequestId%"]);
                            $iRow = $iStmt->fetch(PDO::FETCH_ASSOC);
                            $imgMsgId = $iRow ? (int)$iRow['id'] : null;
                        }
                    }

                    echo json_encode([
                        "status" => "success",
                        "message" => "تم استلام الطلب مسبقاً بنجاح.",
                        "data" => [
                            "request_id" => $origRequestId,
                            "service_id" => $serviceId,
                            "service_price_points" => $servicePricePoints,
                            "points_charged" => $pointsCharged,
                            "payment_method" => $paymentMethod,
                            "balance_before" => $balanceAfter,
                            "balance_after" => $balanceAfter,
                            "wallet_transaction_id" => $txId,
                            "chat_id" => $chatId,
                            "chat_text_message_id" => $textMsgId,
                            "chat_image_message_id" => $imgMsgId
                        ]
                    ], JSON_UNESCAPED_UNICODE);
                    exit();
                }
            } catch (Throwable $dupEx) {
                // Fall back to original error
            }
        }

        // Log the internal server error
        error_log("Error in submit: " . $e->getMessage() . " in " . $e->getFile() . " on line " . $e->getLine());

        while (ob_get_level() > 0) {
            ob_end_clean();
        }

        // Determine user validation errors versus internal errors
        $validationKeywords = [
            "تفاصيل الطلب مطلوبة",
            "غير موجودة في النظام",
            "معرف الخدمة",
            "طريقة الدفع",
            "رصيد النقاط غير كافٍ",
            "تسجيل الدخول مطلوب"
        ];
        $isValidationError = false;
        foreach ($validationKeywords as $keyword) {
            if (strpos($e->getMessage(), $keyword) !== false) {
                $isValidationError = true;
                break;
            }
        }

        http_response_code($isValidationError ? 400 : 500);
        echo json_encode([
            "status" => "error",
            "message" => $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
    }
}
exit();
?>
