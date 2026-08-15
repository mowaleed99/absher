<?php
// Production Comprehensive Smoke Test & Financial Integrity Suite
require_once __DIR__ . '/../backend_php/config/db.php';
require_once __DIR__ . '/../backend_php/api/core/jwt.php';

echo "========================================================\n";
echo "STARTING PRODUCTION SMOKE & INTEGRITY TEST SUITE\n";
echo "Database: absher_georgia_db | API: /api/ | Admin: /admin/\n";
echo "========================================================\n";

$passCount = 0;
$failCount = 0;

function assertCondition($condition, $description) {
    global $passCount, $failCount;
    if ($condition) {
        echo "  [PASS] $description\n";
        $passCount++;
    } else {
        echo "  [FAIL] $description\n";
        $failCount++;
    }
}

// Record initial state for financial integrity checks
$initialBalances = $conn->query("SELECT id, points FROM students ORDER BY id ASC")->fetchAll(PDO::FETCH_KEY_PAIR);
$initialTxCount = $conn->query("SELECT COUNT(*) FROM wallet_transactions")->fetchColumn();
$initialSrCount = $conn->query("SELECT COUNT(*) FROM service_requests")->fetchColumn();

// Generate admin token
$stmtAdmin = $conn->query("SELECT id, username FROM admins LIMIT 1");
$adminRow = $stmtAdmin->fetch(PDO::FETCH_ASSOC);
$adminToken = JWT::encode([
    'admin_id' => $adminRow ? (int)$adminRow['id'] : 1,
    'username' => $adminRow ? $adminRow['username'] : 'admin',
    'type' => 'admin',
    'role' => 'admin',
    'exp' => time() + 3600
]);

// Generate student token for student ID 1 (or first student)
$stmtStd = $conn->query("SELECT id, email, full_name FROM students WHERE is_blocked = 0 LIMIT 1");
$stdRow = $stmtStd->fetch(PDO::FETCH_ASSOC);
$studentId = $stdRow ? (int)$stdRow['id'] : 1;
$studentToken = JWT::encode([
    'student_id' => $studentId,
    'email' => $stdRow ? $stdRow['email'] : 'test@absher.ge',
    'exp' => time() + 3600
]);

$createdOfferIds = [];
$createdPromoIds = [];
$createdFiles = [];

try {
    // --- 1. Read-Only Production API Endpoints ---
    echo "\n--- 1. Testing Read-Only Public & Admin API Endpoints ---\n";

    // A. Public Apartments List
    $ch = curl_init('http://127.0.0.1/api/apartments/list.php');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $aptRes = curl_exec($ch);
    $aptCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $aptData = json_decode($aptRes, true);
    assertCondition($aptCode === 200 && (isset($aptData['success']) || isset($aptData['status'])), "Public Apartments endpoint returns HTTP 200");

    // B. Public Services List
    $ch = curl_init('http://127.0.0.1/api/services/list.php');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $svcRes = curl_exec($ch);
    $svcCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $svcData = json_decode($svcRes, true);
    assertCondition($svcCode === 200 && (isset($svcData['success']) || isset($svcData['status'])), "Public Services endpoint returns HTTP 200");

    // C. Public Housing Offers List
    $ch = curl_init('http://127.0.0.1/api/offers/list.php');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $hoRes = curl_exec($ch);
    $hoCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $hoData = json_decode($hoRes, true);
    assertCondition($hoCode === 200 && isset($hoData['data']['offers']), "Public Housing Offers endpoint returns HTTP 200");

    // D. Admin get_all with 8 KPI Counters
    $ch = curl_init('http://127.0.0.1/api/admin_api.php?action=get_all');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Bearer $adminToken"]);
    $adminRes = curl_exec($ch);
    $adminCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $adminData = json_decode($adminRes, true);
    if ($adminCode !== 200) {
        echo "  [DEBUG] Admin get_all error ($adminCode): $adminRes\n";
    }
    assertCondition($adminCode === 200 && isset($adminData['stats']), "Admin API get_all returns HTTP 200 with stats object");
    assertCondition(isset($adminData['stats']['active_housing_offers_count']), "Admin API includes active_housing_offers_count 8th KPI");
    assertCondition(isset($adminData['stats']['promo_codes_count']), "Admin API includes promo_codes_count KPI");

    // --- 2. Production Promo Codes Validation & CRUD Smoke Test ---
    echo "\n--- 2. Testing Production Promo Codes Flow (Self-Cleaning) ---\n";

    // Create a temporary promo code
    $promoCodeStr = 'PROD_SMOKE_' . rand(1000, 9999);
    $ch = curl_init('http://127.0.0.1/api/admin_api.php');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: Bearer $adminToken",
        "Content-Type: application/json"
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'action' => 'add_promo_code',
        'code' => $promoCodeStr,
        'discount_type' => 'percentage',
        'discount_value' => 20,
        'max_discount_points' => 50,
        'min_service_price_points' => 10,
        'total_usage_limit' => 10,
        'per_student_limit' => 2,
        'service_scope' => 'all',
        'audience_scope' => 'all',
        'status' => 'active',
        'campaign_name' => 'Production Smoke Test'
    ]));
    $addPromoRes = curl_exec($ch);
    $addPromoCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $addPromoData = json_decode($addPromoRes, true);
    if ($addPromoCode !== 200) {
        echo "  [DEBUG] Add promo error ($addPromoCode): $addPromoRes\n";
    }
    $createdPromoId = $addPromoData['id'] ?? $addPromoData['data']['id'] ?? $addPromoData['promo_code_id'] ?? 0;
    if ($createdPromoId > 0) $createdPromoIds[] = $createdPromoId;
    assertCondition($addPromoCode === 200 && $createdPromoId > 0, "Created temporary production promo code: $promoCodeStr (ID: $createdPromoId)");

    // Get an available service
    $stmtSvc = $conn->query("SELECT id, price_points FROM services WHERE price_points >= 10 LIMIT 1");
    $svcRow = $stmtSvc->fetch(PDO::FETCH_ASSOC);
    $testSvcId = $svcRow ? (int)$svcRow['id'] : 1;

    // Validate promo code via student endpoint
    $ch = curl_init('http://127.0.0.1/api/services/validate_promo.php');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: Bearer $studentToken",
        "Content-Type: application/json"
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'code' => $promoCodeStr,
        'service_id' => $testSvcId,
        'payment_method' => 'wallet'
    ]));
    $valRes = curl_exec($ch);
    $valCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $valData = json_decode($valRes, true);
    assertCondition($valCode === 200 && ($valData['data']['is_valid'] ?? false) === true, "Student promo validation succeeded for wallet points");

    // Cash payment rejection test
    $ch = curl_init('http://127.0.0.1/api/services/validate_promo.php');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: Bearer $studentToken",
        "Content-Type: application/json"
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'code' => $promoCodeStr,
        'service_id' => $testSvcId,
        'payment_method' => 'cash'
    ]));
    $cashRes = curl_exec($ch);
    $cashCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $cashData = json_decode($cashRes, true);
    assertCondition($cashCode === 400 && ($cashData['error_code'] ?? '') === 'PROMO_WALLET_ONLY', "Promo validation rejected cash payment method with PROMO_WALLET_ONLY");

    // --- 3. Production Housing Offers & Image Upload Smoke Test ---
    echo "\n--- 3. Testing Production Housing Offers & Image Upload (Self-Cleaning) ---\n";

    // Upload test JPEG image
    $tempJpeg = tempnam(sys_get_temp_dir(), 'prod_smoke_') . '.jpg';
    $img = imagecreatetruecolor(10, 10);
    imagejpeg($img, $tempJpeg);
    imagedestroy($img);

    $ch = curl_init('http://127.0.0.1/api/upload/image.php?folder=housing_offers');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Bearer $adminToken"]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, [
        'image' => new CURLFile($tempJpeg, 'image/jpeg', 'prod_test.jpg')
    ]);
    $upRes = curl_exec($ch);
    $upCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $upData = json_decode($upRes, true);
    $uploadedUrl = $upData['url'] ?? $upData['data']['url'] ?? '';
    assertCondition($upCode === 200 && strpos($uploadedUrl, 'uploads/housing_offers/') === 0, "Uploaded JPEG to production uploads/housing_offers/ ($uploadedUrl)");

    $diskFile = dirname(__DIR__) . '/backend_php/' . $uploadedUrl;
    assertCondition(file_exists($diskFile), "Uploaded image physically exists in production directory ($diskFile)");
    $createdFiles[] = $diskFile;
    @unlink($tempJpeg);

    // Get an apartment
    $stmtApt = $conn->query("SELECT id FROM apartments WHERE is_available = 1 LIMIT 1");
    $aptRow = $stmtApt->fetch(PDO::FETCH_ASSOC);
    $prodAptId = $aptRow ? (int)$aptRow['id'] : 1;

    // Create temporary housing offer
    $ch = curl_init('http://127.0.0.1/api/admin_api.php');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: Bearer $adminToken",
        "Content-Type: application/json"
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'action' => 'add_housing_offer',
        'apartment_id' => $prodAptId,
        'title' => 'عرض تجريبي للإنتاج',
        'description' => 'وصف تجريبي',
        'original_price' => 500,
        'offer_price' => 400,
        'badge_text' => 'خصم 20%',
        'image_url' => $uploadedUrl,
        'is_active' => 1,
        'display_order' => 1
    ]));
    $addHoRes = curl_exec($ch);
    $addHoCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $addHoData = json_decode($addHoRes, true);
    if ($addHoCode !== 200) {
        echo "  [DEBUG] Add housing offer error ($addHoCode): $addHoRes\n";
    }
    $createdOfferId = $addHoData['id'] ?? $addHoData['data']['id'] ?? $addHoData['offer_id'] ?? 0;
    if ($createdOfferId > 0) $createdOfferIds[] = $createdOfferId;
    assertCondition($addHoCode === 200 && $createdOfferId > 0, "Created temporary production housing offer (ID: $createdOfferId)");

    // Test public single offer details
    $ch = curl_init("http://127.0.0.1/api/offers/details.php?id=$createdOfferId");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $dtRes = curl_exec($ch);
    $dtCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $dtData = json_decode($dtRes, true);
    assertCondition($dtCode === 200 && ($dtData['data']['offer']['image_url'] ?? '') === $uploadedUrl, "Public single offer details returned uploaded image URL");

    // Public image retrieval check via HTTP
    $ch = curl_init("http://127.0.0.1/$uploadedUrl");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, true);
    curl_setopt($ch, CURLOPT_NOBODY, true);
    $imgHeadRes = curl_exec($ch);
    $imgHeadCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $imgContentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    curl_close($ch);
    assertCondition($imgHeadCode === 200 && strpos($imgContentType, 'image/') !== false, "Uploaded image publicly accessible over HTTP ($imgHeadCode, Content-Type: $imgContentType)");

    // Delete housing offer and verify image cleanup
    $ch = curl_init('http://127.0.0.1/api/admin_api.php');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: Bearer $adminToken",
        "Content-Type: application/json"
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'action' => 'delete_housing_offer',
        'id' => $createdOfferId
    ]));
    $delHoRes = curl_exec($ch);
    curl_close($ch);
    assertCondition(!file_exists($diskFile), "Deleted offer custom image was safely cleaned up from disk");

    // Delete test promo code
    $ch = curl_init('http://127.0.0.1/api/admin_api.php');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: Bearer $adminToken",
        "Content-Type: application/json"
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'action' => 'delete_promo_code',
        'id' => $createdPromoId
    ]));
    $delPromoRes = curl_exec($ch);
    curl_close($ch);

    // --- 4. Teardown & Financial Integrity Verification ---
    echo "\n--- 4. Production Teardown & Financial Integrity Verification ---\n";

    // Clean any remaining IDs
    foreach ($createdOfferIds as $oid) {
        $conn->exec("DELETE FROM housing_offers WHERE id = $oid");
    }
    foreach ($createdPromoIds as $pid) {
        $conn->exec("DELETE FROM promo_codes WHERE id = $pid");
    }
    foreach ($createdFiles as $f) {
        if (file_exists($f)) @unlink($f);
    }

    // Check financial balances
    $finalBalances = $conn->query("SELECT id, points FROM students ORDER BY id ASC")->fetchAll(PDO::FETCH_KEY_PAIR);
    $balancesIdentical = ($initialBalances === $finalBalances);
    assertCondition($balancesIdentical, "All student wallet balances remained 100% unchanged during smoke tests");

    $finalTxCount = $conn->query("SELECT COUNT(*) FROM wallet_transactions")->fetchColumn();
    assertCondition($initialTxCount == $finalTxCount, "Zero leftover transactions created in production wallet_transactions ($finalTxCount rows)");

    $finalSrCount = $conn->query("SELECT COUNT(*) FROM service_requests")->fetchColumn();
    assertCondition($initialSrCount == $finalSrCount, "Zero leftover requests created in production service_requests ($finalSrCount rows)");

    $leftoverPromos = $conn->query("SELECT COUNT(*) FROM promo_codes WHERE code LIKE 'PROD_SMOKE_%'")->fetchColumn();
    assertCondition($leftoverPromos == 0, "Zero leftover smoke test promo codes in database");

    $leftoverOffers = $conn->query("SELECT COUNT(*) FROM housing_offers WHERE title = 'عرض تجريبي للإنتاج'")->fetchColumn();
    assertCondition($leftoverOffers == 0, "Zero leftover smoke test housing offers in database");

    echo "\n========================================================\n";
    echo "PRODUCTION SMOKE TEST RESULTS: $passCount Passed, $failCount Failed\n";
    echo "========================================================\n";

    if ($failCount > 0) {
        exit(1);
    }

} catch (Exception $e) {
    echo "\n[ERROR] Exception during smoke tests: " . $e->getMessage() . "\n";
    exit(1);
}
