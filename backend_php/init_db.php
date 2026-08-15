<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "Initializing Absher Georgia Database...\n";

try {
    $pdo = new PDO("mysql:host=127.0.0.1;charset=utf8mb4", "root", "");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `absher_georgia_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
    echo "[OK] Database 'absher_georgia_db' created / checked.\n";
    
    $pdo->exec("USE `absher_georgia_db`;");
    
    $schemaFile = __DIR__ . '/schema.sql';
    if (file_exists($schemaFile)) {
        $sql = file_get_contents($schemaFile);
        $pdo->exec($sql);
        echo "[OK] Schema imported from schema.sql\n";
    } else {
        echo "[WARNING] schema.sql not found.\n";
    }

    echo "Database setup completed successfully.\n";
} catch (Exception $e) {
    echo "[ERROR] " . $e->getMessage() . "\n";
}
