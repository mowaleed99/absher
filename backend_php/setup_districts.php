<?php
$host = '127.0.0.1';
$db = 'absher_georgia_db';
$user = 'root';
$pass = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $sql = "
    CREATE TABLE IF NOT EXISTS `districts` (
      `id` int(11) NOT NULL AUTO_INCREMENT,
      `name` varchar(255) NOT NULL UNIQUE,
      `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";
    $pdo->exec($sql);
    echo "Table 'districts' created successfully.\n";

    $insert = "
    INSERT IGNORE INTO `districts` (`name`) VALUES
    ('سابورتالو (Saburtalo)'),
    ('فاكي (Vake)'),
    ('ديدوبي (Didube)'),
    ('متاتسميندا (Mtatsminda)'),
    ('إساني (Isani)'),
    ('جلَداني (Gldani)')
    ";
    $pdo->exec($insert);
    echo "Districts inserted successfully.\n";

} catch(PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
