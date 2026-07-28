<?php
$db = new PDO('mysql:host=localhost;dbname=absher_georgia_db', 'root', '');
$stmt = $db->query('SHOW CREATE TABLE apartments');
print_r($stmt->fetch(PDO::FETCH_ASSOC));
