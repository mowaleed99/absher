<?php
// Migration: Add image_url column to news table
// Run: php run_news_migration.php

require_once __DIR__ . '/config/db.php';

echo "=== News Table Migration ===" . PHP_EOL;

// Check if column already exists
$cols = $conn->query("SHOW COLUMNS FROM news LIKE 'image_url'")->fetchAll();
if (!empty($cols)) {
    echo "Column image_url already exists. No migration needed." . PHP_EOL;
    exit(0);
}

// Add column
$conn->exec("ALTER TABLE news ADD COLUMN image_url VARCHAR(500) NULL DEFAULT NULL AFTER content");
echo "✅ Added image_url column to news table." . PHP_EOL;

// Verify
$verify = $conn->query("SHOW CREATE TABLE news")->fetch(PDO::FETCH_ASSOC);
echo PHP_EOL . "=== Verified Schema ===" . PHP_EOL;
echo $verify['Create Table'] . PHP_EOL;

// Test insert
$stmt = $conn->prepare("INSERT INTO news (title, content, image_url) VALUES (?, ?, ?)");
$stmt->execute(['اختبار المخطط', 'محتوى اختباري للتحقق من الإدراج', null]);
$newId = $conn->lastInsertId();
echo PHP_EOL . "✅ Test insert succeeded — new news row id=$newId" . PHP_EOL;

// Clean up test row
$conn->exec("DELETE FROM news WHERE id=$newId");
echo "✅ Test row deleted cleanly." . PHP_EOL;

echo PHP_EOL . "=== Rollback SQL (if needed) ===" . PHP_EOL;
echo "ALTER TABLE news DROP COLUMN image_url;" . PHP_EOL;
