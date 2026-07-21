<?php
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../core/response.php';
require_once __DIR__ . '/../core/headers.php';

try {
    $stmt = $conn->query('SELECT id, name FROM universities ORDER BY name ASC');
    $universities = $stmt->fetchAll(PDO::FETCH_ASSOC);
    jsonResponse(true, '', 200, $universities);
} catch (PDOException $e) {
    error_log('Error fetching universities: ' . $e->getMessage());
    jsonResponse(false, 'Failed to fetch universities', 500);
}
