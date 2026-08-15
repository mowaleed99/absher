<?php
require_once __DIR__ . '/../backend_php/config/db_staging.php';

echo "=== 1. Creating backup of promo tables on Staging ===\n";
$conn->exec("CREATE TABLE IF NOT EXISTS _backup_promo_codes_20260815 AS SELECT * FROM promo_codes");
$conn->exec("CREATE TABLE IF NOT EXISTS _backup_promo_code_redemptions_20260815 AS SELECT * FROM promo_code_redemptions");
echo "Backup tables created successfully.\n";

echo "\n=== 2. Reconciling synthetic test promo codes ===\n";
// Find TEST_USED_IMMUTABLE (id 186 or by code)
$pStmt = $conn->query("SELECT id, code, used_count FROM promo_codes WHERE code = 'TEST_USED_IMMUTABLE'")->fetch(PDO::FETCH_ASSOC);
if ($pStmt) {
    $promoId = (int)$pStmt['id'];
    $curRedCnt = (int)$conn->query("SELECT COUNT(*) FROM promo_code_redemptions WHERE promo_code_id = $promoId")->fetchColumn();
    if ($curRedCnt < 3) {
        $needed = 3 - $curRedCnt;
        $insStmt = $conn->prepare("
            INSERT INTO promo_code_redemptions (
                promo_code_id, service_request_id, request_id_snapshot, student_id,
                student_name_snapshot, student_phone_snapshot, student_email_snapshot,
                service_id, service_title_snapshot, code_snapshot, campaign_snapshot,
                discount_type_snapshot, discount_value_snapshot, original_price_points,
                discount_points, final_price_points, payment_method, status
            ) VALUES (
                ?, NULL, 9900 + ?, 1,
                'طالب تجريبي (توثيق النظام)', '0555123456', 'demo@absher.ge',
                1, 'خدمة ترجمة معتمدة', 'TEST_USED_IMMUTABLE', 'Used Promo',
                'percentage', 20.00, 100, 20, 80, 'wallet', 'applied'
            )
        ");
        for ($i = 1; $i <= $needed; $i++) {
            $insStmt->execute([$promoId, $i]);
        }
        echo "Inserted $needed matching redemption records for TEST_USED_IMMUTABLE (ID: $promoId).\n";
    }
}

echo "\n=== 3. Running global used_count reconciliation ===\n";
$conn->exec("
    UPDATE promo_codes p
    SET p.used_count = (
        SELECT COUNT(*)
        FROM promo_code_redemptions r
        WHERE r.promo_code_id = p.id AND r.status = 'applied'
    )
");
echo "Global reconciliation completed.\n";

echo "\n=== 4. Verified State Audit Table ===\n";
$rows = $conn->query("
    SELECT p.id, p.code, p.campaign_name, p.used_count,
           (SELECT COUNT(*) FROM promo_code_redemptions r WHERE r.promo_code_id = p.id AND r.status = 'applied') AS applied_cnt,
           (SELECT COUNT(*) FROM promo_code_redemptions r WHERE r.promo_code_id = p.id) AS total_cnt,
           (SELECT COALESCE(SUM(discount_points), 0) FROM promo_code_redemptions r WHERE r.promo_code_id = p.id AND r.status = 'applied') AS points_saved
    FROM promo_codes p
    ORDER BY p.id ASC
")->fetchAll(PDO::FETCH_ASSOC);

echo sprintf("%-5s | %-20s | %-20s | %-10s | %-10s | %-10s | %-15s\n", "ID", "Code", "Campaign", "used_count", "applied", "total_hist", "points_saved");
echo str_repeat("-", 95) . "\n";
foreach ($rows as $r) {
    echo sprintf("%-5d | %-20s | %-20s | %-10d | %-10d | %-10d | %-15d\n",
        $r['id'], $r['code'], mb_substr($r['campaign_name'], 0, 18), $r['used_count'], $r['applied_cnt'], $r['total_cnt'], $r['points_saved']
    );
}
