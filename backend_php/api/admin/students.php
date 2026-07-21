<?php
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../core/response.php';
require_once __DIR__ . '/../core/headers.php';

AuthMiddleware::requireAdmin();

$search = $_GET['search'] ?? '';
$page = max(1, (int)($_GET['page'] ?? 1));
$limit = max(1, min(100, (int)($_GET['limit'] ?? 20)));
$offset = ($page - 1) * $limit;

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'DELETE') {
        $data = json_decode(file_get_contents("php://input"), true) ?? $_POST;
        $student_id = $_GET['id'] ?? $data['id'] ?? null;
        
        if (!$student_id) {
            jsonResponse(false, "id is required", 400);
        }

        $stmt = $conn->prepare("UPDATE students SET deleted_at = NOW() WHERE id = ?");
        $stmt->execute([$student_id]);

        jsonResponse(true, "Student deleted", 200);
        exit;
    }
    $where = "WHERE deleted_at IS NULL";
    $params = [];

    if (!empty($search)) {
        $where .= " AND (full_name LIKE ? OR email LIKE ? OR phone LIKE ?)";
        $searchTerm = "%$search%";
        $params = array_merge($params, [$searchTerm, $searchTerm, $searchTerm]);
    }

    // Get total count
    $countStmt = $conn->prepare("SELECT COUNT(*) FROM students $where");
    $countStmt->execute($params);
    $total = $countStmt->fetchColumn();

    // Get students
    $query = "SELECT id, full_name, email, phone, university_id, points_balance, created_at FROM students $where ORDER BY created_at DESC LIMIT ? OFFSET ?";
    $stmt = $conn->prepare($query);
    
    foreach ($params as $i => $param) {
        $stmt->bindValue($i + 1, $param);
    }
    $stmt->bindValue(count($params) + 1, $limit, PDO::PARAM_INT);
    $stmt->bindValue(count($params) + 2, $offset, PDO::PARAM_INT);
    $stmt->execute();
    
    $students = $stmt->fetchAll();

    jsonResponse(true, "Success", 200, [
        "students" => $students,
        "pagination" => [
            "total" => $total,
            "page" => $page,
            "limit" => $limit
        ]
    ]);
} catch (PDOException $e) {
    error_log("Database error in " . __FILE__ . " on line " . __LINE__ . ": " . $e->getMessage());
    jsonResponse(false, "Database error occurred. Please try again later.", 500);
}
