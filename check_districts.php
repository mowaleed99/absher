<?php
$db = new PDO('mysql:host=localhost;dbname=absher_georgia_db', 'root', '');
$stmt = $db->query('SELECT id, title, location, district_id, images FROM apartments ORDER BY id');
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
