Write-Host "Creating deployment package (update.zip)..." -ForegroundColor Yellow

# Create temp directories
if (Test-Path "temp_deploy") { Remove-Item -Recurse -Force "temp_deploy" }
New-Item -ItemType Directory -Path "temp_deploy/admin" -Force | Out-Null
New-Item -ItemType Directory -Path "temp_deploy/api/chat" -Force | Out-Null
New-Item -ItemType Directory -Path "temp_deploy/api/core" -Force | Out-Null

# Copy modified files
Copy-Item "backend_php/admin/index.html" "temp_deploy/admin/"
Copy-Item "backend_php/admin/lang.js" "temp_deploy/admin/"
Copy-Item -Path "backend_php/admin/js" -Destination "temp_deploy/admin/" -Recurse -Force
Copy-Item "backend_php/api/admin_api.php" "temp_deploy/api/"
Copy-Item "backend_php/api/chat/admin_reply.php" "temp_deploy/api/chat/"
Copy-Item "backend_php/api/student_requests.php" "temp_deploy/api/"
Copy-Item "backend_php/api/wallet_api.php" "temp_deploy/api/"
Copy-Item "backend_php/api/core/notification.php" "temp_deploy/api/core/"

# Compress archive
if (Test-Path "update.zip") { Remove-Item "update.zip" -Force }
Compress-Archive -Path "temp_deploy/*" -DestinationPath "update.zip" -Force

# Clean up temp files
Remove-Item -Recurse -Force "temp_deploy"

Write-Host "Deployment package created successfully." -ForegroundColor Green
Write-Host "Uploading package to VPS..." -ForegroundColor Yellow

# Upload update.zip to the server
scp update.zip root@80.241.218.23:/var/www/absher/backend_php/

Write-Host "Extracting package on VPS..." -ForegroundColor Yellow
# Unzip and clean up
ssh root@80.241.218.23 "unzip -o /var/www/absher/backend_php/update.zip -d /var/www/absher/backend_php/ && rm /var/www/absher/backend_php/update.zip"

Write-Host "Deployment finished successfully!" -ForegroundColor Green
