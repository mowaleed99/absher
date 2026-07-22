<?php
// Public endpoint: list all services for students.
// The services table uses: id, title, description, image_url, has_form, created_at
// has_form indicates whether the service presents a request form (not a visibility toggle).
// All services in the table are considered visible.
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../core/response.php';
require_once __DIR__ . '/../core/headers.php';

try {
    $stmt = $conn->query(
        "SELECT id, title, description, image_url, has_form
         FROM services
         ORDER BY id ASC"
    );
    $services = $stmt->fetchAll();

    $result = [];
    foreach ($services as $svc) {
        $result[] = [
            'id'          => (int)$svc['id'],
            'title'       => $svc['title'],
            'description' => $svc['description'],
            'image_url'   => $svc['image_url'],
            'has_form'    => (bool)$svc['has_form'],
        ];
    }

    jsonResponse(true, "Success", 200, ['services' => $result]);

} catch (PDOException $e) {
    error_log("Database error in " . __FILE__ . " on line " . __LINE__ . ": " . $e->getMessage());
    jsonResponse(false, "Database error occurred. Please try again later.", 500);
}
