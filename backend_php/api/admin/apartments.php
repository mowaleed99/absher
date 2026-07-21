<?php
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../core/response.php';
require_once __DIR__ . '/../core/headers.php';

AuthMiddleware::requireAdmin();

$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents("php://input"), true) ?? $_POST;

try {
    if ($method === 'POST') {
        // Create apartment
        $district_id = $data['district_id'] ?? null;
        $title = trim($data['title'] ?? '');
        $description = trim($data['description'] ?? '');
        $price = $data['price'] ?? null;
        $currency = $data['currency'] ?? 'GEL';
        $capacity = isset($data['capacity']) ? (int)$data['capacity'] : null;

        if (!$district_id || empty($title) || empty($description) || $price === null || $price <= 0) {
            jsonResponse(false, "Valid district_id, title, description, and positive price are required", 400);
        }
        if ($capacity !== null && $capacity <= 0) {
            jsonResponse(false, "Capacity must be positive", 400);
        }

        // Validate district exists
        $stmt = $conn->prepare("SELECT id FROM districts WHERE id = ?");
        $stmt->execute([$district_id]);
        if (!$stmt->fetch()) {
            jsonResponse(false, "Invalid district_id", 400);
        }

        $conn->beginTransaction();
        try {
            $stmt = $conn->prepare("INSERT INTO apartments (district_id, title, description, price, currency, capacity, is_available) VALUES (?, ?, ?, ?, ?, ?, 1)");
            $stmt->execute([$district_id, $title, $description, $price, $currency, $capacity]);
            $apartment_id = $conn->lastInsertId();

            if (isset($data['images']) && is_array($data['images'])) {
                $stmtImg = $conn->prepare("INSERT INTO apartment_images (apartment_id, image_url, is_primary) VALUES (?, ?, ?)");
                foreach ($data['images'] as $img) {
                    $url = trim($img['url'] ?? '');
                    $is_primary = !empty($img['is_primary']) ? 1 : 0;
                    if (empty($url) || strpos($url, '/uploads/') !== 0) {
                        $conn->rollBack();
                        jsonResponse(false, "Invalid image URL. Must be an internal uploaded asset.", 400);
                    }
                    $stmtImg->execute([$apartment_id, $url, $is_primary]);
                }
            }
            $conn->commit();
            jsonResponse(true, "Apartment created", 201, ["apartment_id" => $apartment_id]);
        } catch (Exception $ex) {
            $conn->rollBack();
            throw $ex;
        }

    } elseif ($method === 'PUT') {
        // Update apartment
        $apartment_id = $data['id'] ?? null;
        $district_id = $data['district_id'] ?? null;
        $title = trim($data['title'] ?? '');
        $description = trim($data['description'] ?? '');
        $price = $data['price'] ?? null;
        $currency = $data['currency'] ?? 'GEL';
        $capacity = isset($data['capacity']) ? (int)$data['capacity'] : null;

        if (!$apartment_id || !$district_id || empty($title) || empty($description) || $price === null || $price <= 0) {
            jsonResponse(false, "Valid id, district_id, title, description, and positive price are required", 400);
        }
        if ($capacity !== null && $capacity <= 0) {
            jsonResponse(false, "Capacity must be positive", 400);
        }

        // Validate district exists
        $stmt = $conn->prepare("SELECT id FROM districts WHERE id = ?");
        $stmt->execute([$district_id]);
        if (!$stmt->fetch()) {
            jsonResponse(false, "Invalid district_id", 400);
        }

        $conn->beginTransaction();
        try {
            $stmt = $conn->prepare("UPDATE apartments SET district_id = ?, title = ?, description = ?, price = ?, currency = ?, capacity = ? WHERE id = ?");
            $stmt->execute([$district_id, $title, $description, $price, $currency, $capacity, $apartment_id]);

            if (isset($data['images']) && is_array($data['images'])) {
                $stmtDel = $conn->prepare("DELETE FROM apartment_images WHERE apartment_id = ?");
                $stmtDel->execute([$apartment_id]);

                $stmtImg = $conn->prepare("INSERT INTO apartment_images (apartment_id, image_url, is_primary) VALUES (?, ?, ?)");
                foreach ($data['images'] as $img) {
                    $url = trim($img['url'] ?? '');
                    $is_primary = !empty($img['is_primary']) ? 1 : 0;
                    if (empty($url) || strpos($url, '/uploads/') !== 0) {
                        $conn->rollBack();
                        jsonResponse(false, "Invalid image URL. Must be an internal uploaded asset.", 400);
                    }
                    $stmtImg->execute([$apartment_id, $url, $is_primary]);
                }
            }
            $conn->commit();
            jsonResponse(true, "Apartment updated", 200);
        } catch (Exception $ex) {
            $conn->rollBack();
            throw $ex;
        }

    } elseif ($method === 'PATCH') {
        // Toggle is_available
        $apartment_id = $data['id'] ?? null;
        if (!$apartment_id) {
            jsonResponse(false, "id is required", 400);
        }

        $stmt = $conn->prepare("UPDATE apartments SET is_available = NOT is_available WHERE id = ?");
        $stmt->execute([$apartment_id]);

        jsonResponse(true, "Apartment availability toggled", 200);

    } elseif ($method === 'DELETE') {
        // Soft delete
        $apartment_id = $_GET['id'] ?? $data['id'] ?? null;
        if (!$apartment_id) {
            jsonResponse(false, "id is required", 400);
        }

        $stmt = $conn->prepare("UPDATE apartments SET deleted_at = NOW(), is_available = 0 WHERE id = ?");
        $stmt->execute([$apartment_id]);

        jsonResponse(true, "Apartment deleted", 200);

    } else {
        jsonResponse(false, "Method not allowed", 405);
    }
} catch (PDOException $e) {
    error_log("Database error in " . __FILE__ . " on line " . __LINE__ . ": " . $e->getMessage());
    jsonResponse(false, "Database error occurred. Please try again later.", 500);
}
