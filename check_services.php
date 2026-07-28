<?php
$db = new PDO('mysql:host=localhost;dbname=absher_georgia_db', 'root', '');
$stmt = $db->query('SELECT id, title, description, price_points, image_url, has_form FROM services ORDER BY id DESC LIMIT 1');
print_r($stmt->fetch(PDO::FETCH_ASSOC));
