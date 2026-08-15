<?php
require_once __DIR__ . '/../backend_php/config/db.php';
$cols = $conn->query("SHOW COLUMNS FROM students")->fetchAll(PDO::FETCH_ASSOC);
echo "Columns in students:\n";
foreach ($cols as $c) {
    echo "  - " . $c['Field'] . " (" . $c['Type'] . ")\n";
}
