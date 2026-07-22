<?php
// =========================================================================
// DEPRECATED: This file is deprecated. 
// Do not use. The application now uses MySQL database instead of database.json.
// =========================================================================
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$data = file_get_contents("php://input");
if ($data) {
    // database.json is deprecated and removed.
    // file_put_contents(__DIR__ . '/../admin/database.json', $data);
    echo json_encode(["status" => "success"]);
} else {
    echo json_encode(["status" => "error", "message" => "No data provided"]);
}
?>
