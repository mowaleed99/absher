<?php
// Endpoint: POST /api_staging/services/validate_promo.php
// Validates a promo code for an authenticated student before booking
ini_set('display_errors', '0');
ini_set('log_errors', '1');

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../../config/db_staging.php';
require_once __DIR__ . '/../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'status' => 'error',
        'error_code' => 'METHOD_NOT_ALLOWED',
        'message' => 'طريقة الطلب غير مسموح بها'
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

// 1. Enforce Authenticated Student JWT Token
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
if (empty($authHeader) || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    http_response_code(401);
    echo json_encode([
        'status' => 'error',
        'error_code' => 'UNAUTHORIZED',
        'message' => 'تسجيل الدخول مطلوب للتحقق من كود الخصم'
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

$token = $matches[1];
$payload = JWT::decode($token);
if (!$payload || empty($payload['student_id'])) {
    http_response_code(401);
    echo json_encode([
        'status' => 'error',
        'error_code' => 'UNAUTHORIZED',
        'message' => 'جلسة تسجيل الدخول غير صالحة أو منتهية'
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

$studentId = intval($payload['student_id']);

// Check student block status
$stdStmt = $conn->prepare("SELECT id, is_blocked FROM students WHERE id = ?");
$stdStmt->execute([$studentId]);
$student = $stdStmt->fetch(PDO::FETCH_ASSOC);
if (!$student) {
    http_response_code(401);
    echo json_encode([
        'status' => 'error',
        'error_code' => 'UNAUTHORIZED',
        'message' => 'حساب الطالب غير موجود'
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

if (!empty($student['is_blocked'])) {
    http_response_code(403);
    echo json_encode([
        'status' => 'error',
        'error_code' => 'ACCOUNT_BLOCKED',
        'message' => 'الحساب محظور من الاستفادة من أكواد الخصم والخدمات'
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

// 2. Parse and Normalize Request Input
$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true) ?? $_POST;

$rawCode = trim($input['code'] ?? '');
$code = strtoupper($rawCode);
$serviceId = intval($input['service_id'] ?? 0);
$paymentMethod = trim($input['payment_method'] ?? 'wallet');

if (empty($code)) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'error_code' => 'INVALID_CODE',
        'message' => 'يرجى إدخال كود الخصم'
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

if (!preg_match('/^[A-Z0-9_-]{3,50}$/', $code)) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'error_code' => 'INVALID_CODE',
        'message' => 'صيغة كود الخصم غير صحيحة'
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

// 3. Enforce Wallet-Only Policy
if ($paymentMethod !== 'wallet') {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'error_code' => 'PROMO_WALLET_ONLY',
        'message' => 'كود الخصم متاح عند الدفع بنقاط المحفظة فقط'
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

// 4. Validate Service and Base Price
if ($serviceId <= 0) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'error_code' => 'SERVICE_NOT_FOUND',
        'message' => 'الخدمة المحددة غير صالحة'
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

$svcStmt = $conn->prepare("SELECT id, title, price_points FROM services WHERE id = ?");
$svcStmt->execute([$serviceId]);
$service = $svcStmt->fetch(PDO::FETCH_ASSOC);

if (!$service) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'error_code' => 'SERVICE_NOT_FOUND',
        'message' => 'الخدمة المحددة غير موجودة'
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

$originalPrice = intval($service['price_points'] ?? 0);
if ($originalPrice <= 0) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'error_code' => 'SERVICE_IS_FREE',
        'message' => 'الخدمة مجانية بالفعل ولا تحتاج إلى كود خصم'
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

// 5. Look up Promo Code
$promoStmt = $conn->prepare("
    SELECT id, code, discount_type, discount_value, max_discount_points, min_service_price_points,
           start_at, expires_at, status, service_scope, audience_scope, total_usage_limit, per_student_limit, used_count
    FROM promo_codes 
    WHERE code = ?
    LIMIT 1
");
$promoStmt->execute([$code]);
$promo = $promoStmt->fetch(PDO::FETCH_ASSOC);

if (!$promo || $promo['status'] === 'archived') {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'error_code' => 'INVALID_CODE',
        'message' => 'كود الخصم غير موجود أو غير صحيح'
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

if ($promo['status'] === 'paused') {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'error_code' => 'DISABLED',
        'message' => 'كود الخصم معطل حالياً'
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

// Date Validity
$now = date('Y-m-d H:i:s');
if (!empty($promo['start_at']) && $now < $promo['start_at']) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'error_code' => 'NOT_STARTED',
        'message' => 'كود الخصم لم يبدأ بعد'
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

if (!empty($promo['expires_at']) && $now > $promo['expires_at']) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'error_code' => 'EXPIRED',
        'message' => 'كود الخصم منتهي الصلاحية'
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

// Service Scope
if ($promo['service_scope'] === 'selected') {
    $scopeStmt = $conn->prepare("SELECT 1 FROM promo_code_services WHERE promo_code_id = ? AND service_id = ?");
    $scopeStmt->execute([$promo['id'], $serviceId]);
    if (!$scopeStmt->fetch()) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'error_code' => 'SERVICE_NOT_ELIGIBLE',
            'message' => 'كود الخصم غير متاح للخدمة المحددة'
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }
}

// Audience Scope
if ($promo['audience_scope'] === 'selected') {
    $audStmt = $conn->prepare("SELECT 1 FROM promo_code_students WHERE promo_code_id = ? AND student_id = ?");
    $audStmt->execute([$promo['id'], $studentId]);
    if (!$audStmt->fetch()) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'error_code' => 'INVALID_CODE',
            'message' => 'كود الخصم غير صحيح أو غير مخصص لحسابك'
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }
}

// Minimum Price Threshold
$minPrice = intval($promo['min_service_price_points'] ?? 0);
if ($minPrice > 0 && $originalPrice < $minPrice) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'error_code' => 'MIN_PRICE_NOT_MET',
        'message' => "سعر الخدمة ($originalPrice نقطة) أقل من الحد الأدنى لتطبيق الكود ($minPrice نقطة)"
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

// Usage Limits
if ($promo['total_usage_limit'] !== null) {
    $totalLimit = intval($promo['total_usage_limit']);
    $cntStmt = $conn->prepare("SELECT COUNT(*) FROM promo_code_redemptions WHERE promo_code_id = ? AND status = 'applied'");
    $cntStmt->execute([$promo['id']]);
    $appliedCount = intval($cntStmt->fetchColumn());
    if ($appliedCount >= $totalLimit) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'error_code' => 'TOTAL_LIMIT_REACHED',
            'message' => 'تم استنفاد الحد الأقصى لاستخدام كود الخصم'
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }
}

if (!empty($promo['per_student_limit'])) {
    $perStudentLimit = intval($promo['per_student_limit']);
    $stdCntStmt = $conn->prepare("SELECT COUNT(*) FROM promo_code_redemptions WHERE promo_code_id = ? AND student_id = ? AND status = 'applied'");
    $stdCntStmt->execute([$promo['id'], $studentId]);
    $stdAppliedCount = intval($stdCntStmt->fetchColumn());
    if ($stdAppliedCount >= $perStudentLimit) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'error_code' => 'STUDENT_LIMIT_REACHED',
            'message' => 'لقد تجاوزت الحد الأقصى المسموح لك لاستخدام هذا الكود'
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }
}

// 6. Calculate Exact Discount Arithmetic
$discountType = $promo['discount_type'];
$discountValue = floatval($promo['discount_value']);
$maxDiscountPoints = !empty($promo['max_discount_points']) ? intval($promo['max_discount_points']) : null;

$discountPoints = 0;
if ($discountType === 'percentage') {
    $rawDiscount = $originalPrice * ($discountValue / 100.0);
    $discountPoints = (int)floor($rawDiscount);
    // Positive floor protection: if promo is valid, clamp to at least 1 point of real saving
    if ($discountPoints === 0 && $originalPrice > 0) {
        $discountPoints = 1;
    }
    if ($maxDiscountPoints !== null && $maxDiscountPoints > 0) {
        $discountPoints = min($discountPoints, $maxDiscountPoints);
    }
} else if ($discountType === 'fixed') {
    $discountPoints = min(intval($discountValue), $originalPrice);
} else if ($discountType === 'free') {
    $discountPoints = $originalPrice;
}

$discountPoints = min($discountPoints, $originalPrice);
$finalPrice = max(0, $originalPrice - $discountPoints);

// 7. Output Success Response (Internal campaign_name is omitted from public response)
http_response_code(200);
echo json_encode([
    'status' => 'success',
    'data' => [
        'is_valid' => true,
        'promo_code_id' => intval($promo['id']),
        'code' => $promo['code'],
        'discount_type' => $discountType,
        'discount_value' => $discountValue,
        'original_price' => $originalPrice,
        'discount_points' => $discountPoints,
        'final_price' => $finalPrice,
        'message' => ($discountType === 'free') ? 'تم تطبيق كود الخدمة المجانية بنجاح' : "تم تطبيق كود الخصم بنجاح (-$discountPoints نقطة)"
    ]
], JSON_UNESCAPED_UNICODE);
exit();
