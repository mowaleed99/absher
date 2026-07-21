<?php
/**
 * Root index.php for local development server
 * Prevents "Not Found /" error and provides API status information.
 */
header("Content-Type: application/json; charset=UTF-8");
echo json_encode([
    'status' => 'success',
    'service' => 'Absher Georgia Backend API',
    'version' => '1.0.0',
    'message' => 'PHP Backend server is running correctly.'
]);
