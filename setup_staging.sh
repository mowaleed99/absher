#!/bin/bash
set -e

echo '=== Step 0: Starting Staging Environment Setup ==='

# 1. Staging DB Schema-only
echo '1. Creating staging database...'
mysql -e 'DROP DATABASE IF EXISTS absher_georgia_staging; CREATE DATABASE absher_georgia_staging CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;'
mysqldump --no-data absher_georgia_db | mysql absher_georgia_staging

# 2. Seed minimal data
echo '2. Seeding minimal test data...'
mysql absher_georgia_staging < /var/www/absher/scripts/staging_seed_minimal.sql

# 3. Create Official Admin in staging
echo '3. Creating admin account...'
HASH=$(php -r "echo password_hash('SecureAdminPass2026!', PASSWORD_BCRYPT);")
php -r "exit(password_verify('SecureAdminPass2026!', '$HASH') ? 0 : 1);" || { echo 'ERROR: Bcrypt verification failed!'; exit 1; }
mysql absher_georgia_staging -e "INSERT INTO admins (username, email, password, role) VALUES ('absher_admin', 'admin@absher.ge', '$HASH', 'super_admin');"

# 4. Copy api to api_staging
echo '4. Creating api_staging directory...'
rm -rf /var/www/absher/backend_php/api_staging
cp -r /var/www/absher/backend_php/api /var/www/absher/backend_php/api_staging

# 5. Staging .env
echo '5. Writing api_staging/.env...'
JWT_RAND=$(openssl rand -hex 16)
cat > /var/www/absher/backend_php/api_staging/.env << ENV_EOF
DB_HOST=127.0.0.1
DB_NAME=absher_georgia_staging
DB_USER=root
DB_PASS=
JWT_SECRET=staging_jwt_secret_${JWT_RAND}
ALLOWED_ORIGINS=http://80.241.218.23,http://localhost:5173,http://127.0.0.1:5173
ENV_EOF

# 6. Create config/db_staging.php
echo '6. Creating config/db_staging.php...'
cat > /var/www/absher/backend_php/config/db_staging.php << 'DB_EOF'
<?php
// Staging-only DB config — loaded by api_staging files only
// Never required by production api/
require_once __DIR__ . '/../api_staging/core/env.php';
Env::load(__DIR__ . '/../api_staging/.env');  // loads staging .env explicitly

require_once __DIR__ . '/../api_staging/core/headers.php';
require_once __DIR__ . '/../api_staging/core/response.php';

$host    = Env::get('DB_HOST', '127.0.0.1');
$db_name = Env::get('DB_NAME', 'absher_georgia_staging');  // default is staging
$username = Env::get('DB_USER', 'root');
$password = Env::get('DB_PASS', '');

define('JWT_SECRET', Env::get('JWT_SECRET', 'staging_default_secret'));

try {
    $conn = new PDO("mysql:host=$host;dbname=$db_name;charset=utf8mb4", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $conn->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
    $conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    error_log("Staging DB error: " . $e->getMessage());
    jsonResponse(false, "Staging database connection failed", 500);
    exit();
}
DB_EOF

# 7. Comprehensive patch of all db.php references in api_staging/ to db_staging.php
echo '7. Patching all db.php references in api_staging/ to db_staging.php...'
find /var/www/absher/backend_php/api_staging/ -type f -exec sed -i "s|config/db\.php|config/db_staging\.php|g" {} +

# 8. Patch api_staging/admin_api.php saveBase64IfPresent
echo '8. Patching api_staging/admin_api.php upload dirs...'
sed -i "s|/../uploads/|/../uploads_staging/|g" /var/www/absher/backend_php/api_staging/admin_api.php
sed -i "s|'uploads/'\.|'uploads_staging/'\.|g" /var/www/absher/backend_php/api_staging/admin_api.php

# 9. Patch api_staging/upload/image.php upload dirs
echo '9. Patching api_staging/upload/image.php upload dirs...'
sed -i "s|/../../uploads/|/../../uploads_staging/|g" /var/www/absher/backend_php/api_staging/upload/image.php
sed -i 's|"url" => "uploads/\$folder/\$filename"|"url" => "uploads_staging/\$folder/\$filename"|g' /var/www/absher/backend_php/api_staging/upload/image.php

# 10. Staging uploads directory & fixtures
echo '10. Setting up uploads_staging...'
mkdir -p /var/www/absher/backend_php/uploads_staging/apartments
if [ -d /var/www/absher/backend_php/uploads/apartments ]; then
    cp -r /var/www/absher/backend_php/uploads/apartments/* /var/www/absher/backend_php/uploads_staging/apartments/ 2>/dev/null || true
fi

# Set permissions
chown -R www-data:www-data /var/www/absher/backend_php/api_staging /var/www/absher/backend_php/uploads_staging /var/www/absher/backend_php/config/db_staging.php
chmod -R 775 /var/www/absher/backend_php/uploads_staging

echo '=== Step 0 Setup Completed Successfully ==='
