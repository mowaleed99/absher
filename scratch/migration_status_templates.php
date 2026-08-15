<?php
// Migration: Create status_reply_templates table and seed default templates
header('Content-Type: text/plain; charset=utf-8');

$databases = ['absher_georgia_db', 'absher_georgia_staging'];

$defaultTemplates = [
    [
        'status_key' => 'قيد المراجعة',
        'status_name_ar' => 'قيد المراجعة',
        'status_name_en' => 'Under Review',
        'template_ar' => "تحديث الطلب (#{id}): تم استلام طلبك الخاص بـ ({service}) وجارٍ مراجعته والتدقيق فيه بعناية.",
        'template_en' => "Request Update (#{id}): Your request for ({service}) has been received and is currently under review.",
        'is_enabled' => 1
    ],
    [
        'status_key' => 'قيد التنفيذ',
        'status_name_ar' => 'قيد التنفيذ',
        'status_name_en' => 'In Progress',
        'template_ar' => "تحديث الطلب (#{id}): طلبك الخاص بـ ({service}) قيد التنفيذ والعمل عليه الآن من قبل فريقنا.",
        'template_en' => "Request Update (#{id}): Your request for ({service}) is now in progress and being handled by our team.",
        'is_enabled' => 1
    ],
    [
        'status_key' => 'مكتمل',
        'status_name_ar' => 'مكتمل',
        'status_name_en' => 'Completed',
        'template_ar' => "تحديث الطلب (#{id}): تهانينا! تم إنجاز طلبك الخاص بـ ({service}) بنجاح. شكراً لثقتك بنا!",
        'template_en' => "Request Update (#{id}): Congratulations! Your request for ({service}) has been completed successfully. Thank you for choosing us!",
        'is_enabled' => 1
    ],
    [
        'status_key' => 'ملغي',
        'status_name_ar' => 'ملغي',
        'status_name_en' => 'Cancelled',
        'template_ar' => "تحديث الطلب (#{id}): نود إعلامك بأنه تم إلغاء طلبك الخاص بـ ({service}).\nالسبب: {reason}",
        'template_en' => "Request Update (#{id}): We would like to inform you that your request for ({service}) was cancelled.\nReason: {reason}",
        'is_enabled' => 1
    ]
];

foreach ($databases as $dbName) {
    echo "========================================\n";
    echo "Running migration on Database: {$dbName}\n";
    echo "========================================\n";

    try {
        $pdo = new PDO("mysql:host=127.0.0.1;dbname={$dbName};charset=utf8mb4", 'root', '', [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]);

        // Create table
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS `status_reply_templates` (
              `id` INT AUTO_INCREMENT PRIMARY KEY,
              `status_key` VARCHAR(50) NOT NULL UNIQUE,
              `status_name_ar` VARCHAR(100) NOT NULL,
              `status_name_en` VARCHAR(100) NOT NULL,
              `template_ar` TEXT NOT NULL,
              `template_en` TEXT NOT NULL,
              `is_enabled` TINYINT(1) DEFAULT 1,
              `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");
        echo "Table status_reply_templates verified/created.\n";

        // Seed default templates
        $stmt = $pdo->prepare("
            INSERT INTO status_reply_templates (status_key, status_name_ar, status_name_en, template_ar, template_en, is_enabled)
            VALUES (:status_key, :status_name_ar, :status_name_en, :template_ar, :template_en, :is_enabled)
            ON DUPLICATE KEY UPDATE
              status_name_ar = VALUES(status_name_ar),
              status_name_en = VALUES(status_name_en),
              template_ar = VALUES(template_ar),
              template_en = VALUES(template_en),
              is_enabled = VALUES(is_enabled)
        ");

        foreach ($defaultTemplates as $tpl) {
            $stmt->execute([
                ':status_key' => $tpl['status_key'],
                ':status_name_ar' => $tpl['status_name_ar'],
                ':status_name_en' => $tpl['status_name_en'],
                ':template_ar' => $tpl['template_ar'],
                ':template_en' => $tpl['template_en'],
                ':is_enabled' => $tpl['is_enabled']
            ]);
        }
        echo "Default templates seeded successfully.\n";

        $count = $pdo->query("SELECT COUNT(*) FROM status_reply_templates")->fetchColumn();
        echo "Total templates in {$dbName}: {$count}\n";

    } catch (Exception $e) {
        echo "ERROR on {$dbName}: " . $e->getMessage() . "\n";
    }
}

echo "Migration finished successfully!\n";
