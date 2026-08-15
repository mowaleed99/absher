<?php
// Comprehensive Integration & Validation Test for Housing Offers on Staging

require_once __DIR__ . '/../backend_php/config/db_staging.php';

echo "========================================================\n";
echo "Starting Housing Offers Integration Test Suite on Staging\n";
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

// Ensure test apartment exists
$testAptId = 0;
$stmtApt = $conn->query("SELECT id FROM apartments WHERE is_available = 1 LIMIT 1");
$aptRow = $stmtApt->fetch(PDO::FETCH_ASSOC);
if ($aptRow) {
    $testAptId = (int)$aptRow['id'];
} else {
    // Insert a temporary test apartment
    $conn->exec("INSERT INTO apartments (title, description, price, location, proximity, capacity, move_in_type, is_available, images, features, universities) VALUES ('TEST_APT_OFFERS', 'Test Apt Description', 500, 'Tbilisi Center', 'Near Metro', 'Single', 'فوري', 1, '[]', '[]', '[]')");
    $testAptId = (int)$conn->lastInsertId();
}

$createdOfferIds = [];

try {
    // 1. Test Schema & Constraints
    echo "\n--- 1. Testing Database Table Schema & Constraints ---\n";
    $tableCheck = $conn->query("SHOW TABLES LIKE 'housing_offers'")->fetch();
    assertCondition(!empty($tableCheck), "Table 'housing_offers' exists in database");

    // 2. Test Inserting Valid Offer
    echo "\n--- 2. Testing Insert Valid Offer ---\n";
    $stmt = $conn->prepare("
        INSERT INTO housing_offers 
        (apartment_id, title, description, original_price, offer_price, badge_text, starts_at, expires_at, is_active, display_order, title_ar, title_en, description_ar, description_en, badge_text_ar, badge_text_en, created_at, updated_at) 
        VALUES (?, 'TEST_OFFER_ACTIVE', 'Test Active Offer Description', 500.00, 420.00, 'TEST_BADGE', NOW() - INTERVAL 1 DAY, NOW() + INTERVAL 30 DAY, 1, 1, 'عرض تجريبي نشط', 'Active Test Offer', 'وصف تجريبي', 'Test desc', 'عرض خاص', 'Special Offer', NOW(), NOW())
    ");
    $stmt->execute([$testAptId]);
    $activeOfferId = (int)$conn->lastInsertId();
    $createdOfferIds[] = $activeOfferId;
    assertCondition($activeOfferId > 0, "Created active test housing offer (ID: $activeOfferId)");

    // 3. Test Student List Endpoint Filters
    echo "\n--- 3. Testing Student Active Offers List ---\n";
    // Future Offer (should NOT appear in active list)
    $stmtFut = $conn->prepare("
        INSERT INTO housing_offers 
        (apartment_id, title, description, original_price, offer_price, starts_at, expires_at, is_active, display_order, created_at, updated_at) 
        VALUES (?, 'TEST_OFFER_FUTURE', 'Future offer', 500.00, 400.00, NOW() + INTERVAL 5 DAY, NOW() + INTERVAL 30 DAY, 1, 2, NOW(), NOW())
    ");
    $stmtFut->execute([$testAptId]);
    $futureOfferId = (int)$conn->lastInsertId();
    $createdOfferIds[] = $futureOfferId;

    // Expired Offer (should NOT appear in active list)
    $stmtExp = $conn->prepare("
        INSERT INTO housing_offers 
        (apartment_id, title, description, original_price, offer_price, starts_at, expires_at, is_active, display_order, created_at, updated_at) 
        VALUES (?, 'TEST_OFFER_EXPIRED', 'Expired offer', 500.00, 400.00, NOW() - INTERVAL 30 DAY, NOW() - INTERVAL 5 DAY, 1, 3, NOW(), NOW())
    ");
    $stmtExp->execute([$testAptId]);
    $expiredOfferId = (int)$conn->lastInsertId();
    $createdOfferIds[] = $expiredOfferId;

    // Paused Offer (should NOT appear in active list)
    $stmtPaused = $conn->prepare("
        INSERT INTO housing_offers 
        (apartment_id, title, description, original_price, offer_price, starts_at, expires_at, is_active, display_order, created_at, updated_at) 
        VALUES (?, 'TEST_OFFER_PAUSED', 'Paused offer', 500.00, 400.00, NOW() - INTERVAL 5 DAY, NOW() + INTERVAL 30 DAY, 0, 4, NOW(), NOW())
    ");
    $stmtPaused->execute([$testAptId]);
    $pausedOfferId = (int)$conn->lastInsertId();
    $createdOfferIds[] = $pausedOfferId;

    // Query active offers matching student query logic
    $now = date('Y-m-d H:i:s');
    $stmtList = $conn->prepare("
        SELECT ho.id, ho.title, ho.original_price, ho.offer_price
        FROM housing_offers ho
        INNER JOIN apartments apt ON ho.apartment_id = apt.id
        WHERE ho.is_active = 1
          AND (ho.starts_at IS NULL OR ho.starts_at <= :now1)
          AND (ho.expires_at IS NULL OR ho.expires_at > :now2)
          AND apt.is_available = 1
    ");
    $stmtList->execute([':now1' => $now, ':now2' => $now]);
    $activeList = $stmtList->fetchAll(PDO::FETCH_ASSOC);
    $activeIds = array_column($activeList, 'id');

    assertCondition(in_array($activeOfferId, $activeIds), "Active valid offer is returned to students");
    assertCondition(!in_array($futureOfferId, $activeIds), "Future scheduled offer is HIDDEN from students");
    assertCondition(!in_array($expiredOfferId, $activeIds), "Expired offer is HIDDEN from students");
    assertCondition(!in_array($pausedOfferId, $activeIds), "Paused/inactive offer is HIDDEN from students");

    // 4. Test Update and Pause / Reactivate
    echo "\n--- 4. Testing Admin Update & Pause/Reactivate ---\n";
    $stmtUp = $conn->prepare("UPDATE housing_offers SET is_active = 0, offer_price = 390.00, updated_at = NOW() WHERE id = ?");
    $stmtUp->execute([$activeOfferId]);
    
    $checkRow = $conn->query("SELECT is_active, offer_price FROM housing_offers WHERE id = $activeOfferId")->fetch(PDO::FETCH_ASSOC);
    assertCondition($checkRow['is_active'] == 0, "Admin can pause/deactivate offer");
    assertCondition(floatval($checkRow['offer_price']) == 390.00, "Admin can update offer price (now 390.00)");

    // Reactivate
    $conn->exec("UPDATE housing_offers SET is_active = 1 WHERE id = $activeOfferId");
    $reactivatedRow = $conn->query("SELECT is_active FROM housing_offers WHERE id = $activeOfferId")->fetch(PDO::FETCH_ASSOC);
    assertCondition($reactivatedRow['is_active'] == 1, "Admin can reactivate offer");

    // 5. Test Reordering
    echo "\n--- 5. Testing Display Order Reordering ---\n";
    $conn->exec("UPDATE housing_offers SET display_order = 99 WHERE id = $activeOfferId");
    $orderRow = $conn->query("SELECT display_order FROM housing_offers WHERE id = $activeOfferId")->fetch(PDO::FETCH_ASSOC);
    assertCondition($orderRow['display_order'] == 99, "Offer display_order updated to 99");

} finally {
    // Teardown: clean up all created test records
    echo "\n--- 6. Teardown & Data Hygiene Cleanup ---\n";
    if (!empty($createdOfferIds)) {
        $inClause = implode(',', array_map('intval', $createdOfferIds));
        $deleted = $conn->exec("DELETE FROM housing_offers WHERE id IN ($inClause)");
        $conn->exec("DELETE FROM apartments WHERE title LIKE 'TEST_APT_%'");
    }
    
    $leftover = $conn->query("SELECT COUNT(*) FROM housing_offers WHERE title LIKE 'TEST_%'")->fetchColumn();
    assertCondition($leftover == 0, "Zero leftover test offers remaining in database");
}

echo "\n========================================================\n";
echo "Housing Offers Test Suite Completed: $passCount Passed, $failCount Failed\n";
echo "========================================================\n";

if ($failCount > 0) {
    exit(1);
}
