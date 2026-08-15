<?php
// Migration: Add is_featured and featured_until to apartments table in production and staging

function runMigration($host, $user, $pass, $dbName) {
    echo "=== Running migration on database: {$dbName} ===\n";
    try {
        $pdo = new PDO("mysql:host={$host};dbname={$dbName};charset=utf8mb4", $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ]);

        // Check if is_featured column exists
        $stmt = $pdo->prepare("SHOW COLUMNS FROM apartments LIKE 'is_featured'");
        $stmt->execute();
        if (!$stmt->fetch()) {
            echo "Adding 'is_featured' and 'featured_until' columns...\n";
            $pdo->exec("
                ALTER TABLE apartments 
                ADD COLUMN is_featured TINYINT(1) NOT NULL DEFAULT 0 AFTER is_available,
                ADD COLUMN featured_until DATETIME NULL DEFAULT NULL AFTER is_featured,
                ADD INDEX idx_featured (is_featured, featured_until)
            ");
            echo "Columns added successfully!\n";
        } else {
            echo "Columns already exist.\n";
        }

        echo "Migration completed on {$dbName}.\n\n";
    } catch (Exception $e) {
        echo "Error migrating {$dbName}: " . $e->getMessage() . "\n\n";
    }
}

// Run on Production
runMigration('localhost', 'root', '', 'absher_georgia_db');

// Run on Staging
runMigration('localhost', 'root', '', 'absher_georgia_staging');
