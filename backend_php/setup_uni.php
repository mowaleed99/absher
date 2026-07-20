<?php
require_once __DIR__ . '/config/db.php';

try {
    // 1. Create universities table
    $sql1 = "CREATE TABLE IF NOT EXISTS `universities` (
        `id` int(11) NOT NULL AUTO_INCREMENT,
        `name` varchar(255) NOT NULL UNIQUE,
        `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
    $conn->exec($sql1);
    echo "Table 'universities' created or already exists.\n";

    // 2. Add universities column to apartments if not exists
    $checkCol = $conn->query("SHOW COLUMNS FROM `apartments` LIKE 'universities'");
    if ($checkCol->rowCount() == 0) {
        $conn->exec("ALTER TABLE `apartments` ADD COLUMN `universities` text DEFAULT NULL AFTER `proximity`");
        echo "Column 'universities' added to 'apartments'.\n";
        
        // Update existing apartments to have an empty array if null
        $conn->exec("UPDATE `apartments` SET `universities` = '[]' WHERE `universities` IS NULL");
    } else {
        echo "Column 'universities' already exists.\n";
    }

    // 3. Seed default universities
    $defaultUnis = [
        'جامعة تبليسي الطبية (TSMU)',
        'جامعة جورجيا (UG)',
        'إيليا الحكومية',
        'القوقاز الدولية (CIU)'
    ];
    $stmt = $conn->prepare("INSERT IGNORE INTO `universities` (`name`) VALUES (?)");
    foreach ($defaultUnis as $u) {
        $stmt->execute([$u]);
    }
    echo "Default universities seeded.\n";

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
