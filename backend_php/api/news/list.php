<?php
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../core/response.php';
require_once __DIR__ . '/../core/headers.php';

// News table does not exist in schema yet, returning empty array to resolve API contract
jsonResponse(true, '', 200, []);
