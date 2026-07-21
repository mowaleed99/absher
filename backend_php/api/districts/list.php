<?php
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../core/response.php';
require_once __DIR__ . '/../core/headers.php';

try {
    $stmt = $conn->query('SELECT id, name FROM districts ORDER BY name ASC');
    $districts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    jsonResponse(true, '', 200, $districts);
} catch (PDOException $e) {
    error_log('Error fetching districts: ' . $e->getMessage());
    jsonResponse(false, 'Failed to fetch districts', 500);
}
