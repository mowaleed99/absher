<?php
function jsonResponse($success, $message = "", $statusCode = 200, $data = []) {
    http_response_code($statusCode);
    
    $response = [
        "success" => $success
    ];
    
    if (!empty($message)) {
        $response["message"] = $message;
    }
    
    if (!empty($data) || is_array($data)) {
        $response["data"] = $data;
    }
    
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit();
}
