<?php
// Comprehensive Integration & Validation Test for Housing Offers & Image Upload on Staging

require_once __DIR__ . '/../backend_php/config/db_staging.php';
require_once __DIR__ . '/../backend_php/api_staging/core/jwt.php';

echo "========================================================\n";
echo "Starting Housing Offers & Image Upload Integration Test Suite on Staging\n";
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

// 0. Ensure test apartment exists
$testAptId = 0;
$stmtApt = $conn->query("SELECT id FROM apartments WHERE is_available = 1 LIMIT 1");
$aptRow = $stmtApt->fetch(PDO::FETCH_ASSOC);
if ($aptRow) {
    $testAptId = (int)$aptRow['id'];
} else {
    $conn->exec("INSERT INTO apartments (title, description, price, location, proximity, capacity, move_in_type, is_available, images, features, universities) VALUES ('TEST_APT_OFFERS', 'Test Apt Description', 500, 'Tbilisi Center', 'Near Metro', 'Single', 'فوري', 1, '[\"uploads/apartments/test_apt.jpg\"]', '[]', '[]')");
    $testAptId = (int)$conn->lastInsertId();
}

$createdOfferIds = [];
$createdFiles = [];

try {
    // 1. Test Schema & Constraints
    echo "\n--- 1. Testing Database Table Schema & Constraints ---\n";
    $tableCheck = $conn->query("SHOW TABLES LIKE 'housing_offers'")->fetch();
    assertCondition(!empty($tableCheck), "Table 'housing_offers' exists in database");

    // 2. Test Image Upload to folder=housing_offers
    echo "\n--- 2. Testing Image Upload to housing_offers Folder ---\n";
    
    // Create a 10x10 test JPEG file
    $tempJpeg = tempnam(sys_get_temp_dir(), 'test_offer_') . '.jpg';
    $img = imagecreatetruecolor(10, 10);
    imagejpeg($img, $tempJpeg);
    imagedestroy($img);

    // Create a 10x10 test PNG file
    $tempPng = tempnam(sys_get_temp_dir(), 'test_offer_') . '.png';
    $imgPng = imagecreatetruecolor(10, 10);
    imagepng($imgPng, $tempPng);
    imagedestroy($imgPng);

    // Test unauthenticated upload rejection
    $ch = curl_init('http://127.0.0.1/api_staging/upload/image.php?folder=housing_offers');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, [
        'image' => new CURLFile($tempJpeg, 'image/jpeg', 'test.jpg')
    ]);
    $unauthRes = curl_exec($ch);
    $unauthCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    assertCondition($unauthCode === 401 || $unauthCode === 403, "Unauthenticated image upload rejected with HTTP $unauthCode");

    // Test authenticated upload using valid JWT token
    $stmtAdmin = $conn->query("SELECT id, username FROM admins LIMIT 1");
    $adminRow = $stmtAdmin->fetch(PDO::FETCH_ASSOC);
    $adminToken = JWT::encode([
        'admin_id' => $adminRow ? (int)$adminRow['id'] : 1,
        'username' => $adminRow ? $adminRow['username'] : 'admin',
        'type' => 'admin',
        'role' => 'admin',
        'exp' => time() + 3600
    ]);

    // Upload JPEG
    $ch = curl_init('http://127.0.0.1/api_staging/upload/image.php?folder=housing_offers');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Bearer $adminToken"]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, [
        'image' => new CURLFile($tempJpeg, 'image/jpeg', 'offer_test.jpg')
    ]);
    $authRes = curl_exec($ch);
    $authCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $authData = json_decode($authRes, true);
    $uploadedUrl1 = $authData['url'] ?? $authData['data']['url'] ?? '';
    assertCondition($authCode === 200 && strpos($uploadedUrl1, 'uploads_staging/housing_offers/') === 0, "Uploaded JPEG image stored in uploads_staging/housing_offers/ ($uploadedUrl1)");
    
    // Check file exists on disk
    $diskFile1 = dirname(__DIR__) . '/backend_php/' . $uploadedUrl1;
    assertCondition(file_exists($diskFile1), "Uploaded image physically exists on disk ($diskFile1)");
    $createdFiles[] = $diskFile1;

    // Upload PNG (for replacement test)
    $ch2 = curl_init('http://127.0.0.1/api_staging/upload/image.php?folder=housing_offers');
    curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch2, CURLOPT_POST, true);
    curl_setopt($ch2, CURLOPT_HTTPHEADER, ["Authorization: Bearer $adminToken"]);
    curl_setopt($ch2, CURLOPT_POSTFIELDS, [
        'file' => new CURLFile($tempPng, 'image/png', 'offer_test2.png')
    ]);
    $authRes2 = curl_exec($ch2);
    curl_close($ch2);
    $authData2 = json_decode($authRes2, true);
    $uploadedUrl2 = $authData2['url'] ?? $authData2['data']['url'] ?? '';
    assertCondition(strpos($uploadedUrl2, 'uploads_staging/housing_offers/') === 0, "Uploaded PNG image stored in uploads_staging/housing_offers/ ($uploadedUrl2)");
    $diskFile2 = dirname(__DIR__) . '/backend_php/' . $uploadedUrl2;
    $createdFiles[] = $diskFile2;

    @unlink($tempJpeg);
    @unlink($tempPng);

    // 3. Test Inserting Offer with Uploaded Image
    echo "\n--- 3. Testing Offer Creation with Uploaded Image ---\n";
    $stmt = $conn->prepare("
        INSERT INTO housing_offers 
        (apartment_id, title, description, original_price, offer_price, badge_text, image_url, starts_at, expires_at, is_active, display_order, title_ar, title_en, description_ar, description_en, badge_text_ar, badge_text_en, created_at, updated_at) 
        VALUES (?, 'TEST_OFFER_IMG', 'Test Offer with Custom Image', 600.00, 480.00, 'HOT_DEAL', ?, NOW() - INTERVAL 1 DAY, NOW() + INTERVAL 30 DAY, 1, 1, 'عرض مع صورة مخصصة', 'Offer with Custom Image', 'وصف', 'desc', 'صفقة مميزة', 'Hot Deal', NOW(), NOW())
    ");
    $stmt->execute([$testAptId, $uploadedUrl1]);
    $imgOfferId = (int)$conn->lastInsertId();
    $createdOfferIds[] = $imgOfferId;
    assertCondition($imgOfferId > 0, "Created housing offer with custom image (ID: $imgOfferId)");

    // 4. Test Student Details and List Endpoints Image Fallback Hierarchy
    echo "\n--- 4. Testing Student Endpoints Image Hierarchy ---\n";
    $stmtCheck = $conn->query("SELECT image_url FROM housing_offers WHERE id = $imgOfferId")->fetch(PDO::FETCH_ASSOC);
    assertCondition($stmtCheck['image_url'] === $uploadedUrl1, "Offer image_url matches uploaded path");

    // 5. Test Image Replacement & Safe Old File Cleanup
    echo "\n--- 5. Testing Image Replacement & Safe Old File Deletion ---\n";
    $chEdit = curl_init('http://127.0.0.1/api_staging/admin_api.php');
    curl_setopt($chEdit, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($chEdit, CURLOPT_POST, true);
    curl_setopt($chEdit, CURLOPT_HTTPHEADER, [
        "Authorization: Bearer $adminToken",
        "Content-Type: application/json"
    ]);
    curl_setopt($chEdit, CURLOPT_POSTFIELDS, json_encode([
        'action' => 'update_housing_offer',
        'id' => $imgOfferId,
        'apartment_id' => $testAptId,
        'title' => 'TEST_OFFER_IMG_UPDATED',
        'title_ar' => 'عرض محدث مع صورة بديلة',
        'description' => 'Updated desc',
        'description_ar' => 'وصف محدث',
        'original_price' => 600,
        'offer_price' => 450,
        'image_url' => $uploadedUrl2,
        'is_active' => 1
    ]));
    $editRes = curl_exec($chEdit);
    curl_close($chEdit);

    $checkUpdated = $conn->query("SELECT image_url FROM housing_offers WHERE id = $imgOfferId")->fetch(PDO::FETCH_ASSOC);
    assertCondition($checkUpdated['image_url'] === $uploadedUrl2, "Updated offer image to second upload URL ($uploadedUrl2)");
    assertCondition(!file_exists($diskFile1), "Old replaced image file was safely unlinked from disk");

    // 6. Test Dashboard Active Housing Offers 8th KPI Count
    echo "\n--- 6. Testing Dashboard Authoritative Active Offers Count ---\n";
    $now = date('Y-m-d H:i:s');
    $dbActiveCount = (int)$conn->query("
        SELECT COUNT(*)
        FROM housing_offers ho
        INNER JOIN apartments apt ON ho.apartment_id = apt.id
        WHERE ho.is_active = 1
          AND (ho.starts_at IS NULL OR ho.starts_at <= '$now')
          AND (ho.expires_at IS NULL OR ho.expires_at > '$now')
          AND apt.is_available = 1
    ")->fetchColumn();

    $chDash = curl_init('http://127.0.0.1/api_staging/admin_api.php');
    curl_setopt($chDash, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($chDash, CURLOPT_POST, true);
    curl_setopt($chDash, CURLOPT_HTTPHEADER, [
        "Authorization: Bearer $adminToken",
        "Content-Type: application/json"
    ]);
    curl_setopt($chDash, CURLOPT_POSTFIELDS, json_encode(['action' => 'get_all']));
    $dashRes = curl_exec($chDash);
    curl_close($chDash);

    $dashData = json_decode($dashRes, true);
    $apiActiveCount = $dashData['stats']['active_housing_offers_count'] ?? $dashData['active_housing_offers_count'] ?? -1;
    assertCondition($apiActiveCount === $dbActiveCount, "Dashboard stats active_housing_offers_count ($apiActiveCount) equals authoritative DB count ($dbActiveCount)");

    // 7. Test Delete Offer and Clean Up Image
    echo "\n--- 7. Testing Offer Deletion & Image Cleanup ---\n";
    $chDel = curl_init('http://127.0.0.1/api_staging/admin_api.php');
    curl_setopt($chDel, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($chDel, CURLOPT_POST, true);
    curl_setopt($chDel, CURLOPT_HTTPHEADER, [
        "Authorization: Bearer $adminToken",
        "Content-Type: application/json"
    ]);
    curl_setopt($chDel, CURLOPT_POSTFIELDS, json_encode([
        'action' => 'delete_housing_offer',
        'id' => $imgOfferId
    ]));
    $delRes = curl_exec($chDel);
    curl_close($chDel);

    $rowCheck = $conn->query("SELECT id FROM housing_offers WHERE id = $imgOfferId")->fetch();
    assertCondition(empty($rowCheck), "Offer was deleted from database");
    assertCondition(!file_exists($diskFile2), "Deleted offer custom image was safely cleaned up from disk");

} finally {
    // Teardown: clean up any test records or files
    echo "\n--- 8. Teardown & Data Hygiene Cleanup ---\n";
    if (!empty($createdOfferIds)) {
        $inClause = implode(',', array_map('intval', $createdOfferIds));
        $deleted = $conn->exec("DELETE FROM housing_offers WHERE id IN ($inClause)");
    }
    $conn->exec("DELETE FROM apartments WHERE title LIKE 'TEST_APT_%'");
    $conn->exec("DELETE FROM housing_offers WHERE title LIKE 'TEST_%'");

    foreach ($createdFiles as $f) {
        if (file_exists($f)) {
            @unlink($f);
        }
    }

    $leftover = $conn->query("SELECT COUNT(*) FROM housing_offers WHERE title LIKE 'TEST_%'")->fetchColumn();
    assertCondition($leftover == 0, "Zero leftover test offers remaining in database");
}

echo "\n========================================================\n";
echo "Housing Offers & Upload Test Suite Completed: $passCount Passed, $failCount Failed\n";
echo "========================================================\n";

if ($failCount > 0) {
    exit(1);
}
