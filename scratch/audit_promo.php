<?php
require_once __DIR__ . '/../backend_php/config/db_staging.php';

$rows = $conn->query("
    SELECT p.id, p.code, p.campaign_name, p.used_count,
           (SELECT COUNT(*) FROM promo_code_redemptions r WHERE r.promo_code_id = p.id AND r.status = 'applied') AS applied_cnt,
           (SELECT COUNT(*) FROM promo_code_redemptions r WHERE r.promo_code_id = p.id) AS total_cnt,
           (SELECT COALESCE(SUM(discount_points), 0) FROM promo_code_redemptions r WHERE r.promo_code_id = p.id AND r.status = 'applied') AS actual_points_saved
    FROM promo_codes p
    ORDER BY p.id ASC
")->fetchAll(PDO::FETCH_ASSOC);

echo sprintf("%-5s | %-20s | %-20s | %-10s | %-10s | %-10s | %-15s\n", "ID", "Code", "Campaign", "used_count", "applied", "total_hist", "points_saved");
echo str_repeat("-", 95) . "\n";
foreach ($rows as $r) {
    echo sprintf("%-5d | %-20s | %-20s | %-10d | %-10d | %-10d | %-15d\n",
        $r['id'], $r['code'], mb_substr($r['campaign_name'], 0, 18), $r['used_count'], $r['applied_cnt'], $r['total_cnt'], $r['actual_points_saved']
    );
}
