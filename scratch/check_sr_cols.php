<?php
require_once __DIR__ . '/../backend_php/config/db.php';
$cols = $conn->query("SHOW COLUMNS FROM service_requests")->fetchAll(PDO::FETCH_ASSOC);
echo "Columns in service_requests:\n";
foreach ($cols as $c) {
    echo "  - " . $c['Field'] . " (" . $c['Type'] . ")\n";
}
