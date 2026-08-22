<?php
// Migration: Add is_special_offer to apartments table in production and staging

function runMigration($host, $user, $pass, $dbName) {
    echo "=== Running migration on database: {$dbName} ===\n";
    try {
        $pdo = new PDO("mysql:host={$host};dbname={$dbName};charset=utf8mb4", $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ]);

        // Check if is_special_offer column exists
        $stmt = $pdo->prepare("SHOW COLUMNS FROM apartments LIKE 'is_special_offer'");
        $stmt->execute();
        if (!$stmt->fetch()) {
            echo "Adding 'is_special_offer' column...\n";
            $pdo->exec("
                ALTER TABLE apartments 
                ADD COLUMN is_special_offer TINYINT(1) NOT NULL DEFAULT 0 AFTER is_featured,
                ADD INDEX idx_special_offer (is_special_offer)
            ");
            echo "Column 'is_special_offer' added successfully!\n";
        } else {
            echo "Column 'is_special_offer' already exists.\n";
        }

        echo "Migration completed on {$dbName}.\n\n";
    } catch (Exception $e) {
        echo "Error migrating {$dbName}: " . $e->getMessage() . "\n\n";
    }
}

// Check if PDO MySQL driver is available locally, or try connecting
$dbUser = getenv('DB_USER') ?: 'root';
$dbPass = getenv('DB_PASS') ?: '';
$dbHost = getenv('DB_HOST') ?: 'localhost';

runMigration($dbHost, $dbUser, $dbPass, 'absher_georgia_db');
runMigration($dbHost, $dbUser, $dbPass, 'absher_georgia_staging');
