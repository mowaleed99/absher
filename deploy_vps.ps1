Write-Host "Creating deployment package (update.zip)..." -ForegroundColor Yellow

# Create temp directories
if (Test-Path "temp_deploy") { Remove-Item -Recurse -Force "temp_deploy" }
New-Item -ItemType Directory -Path "temp_deploy/admin" -Force | Out-Null
New-Item -ItemType Directory -Path "temp_deploy/admin_v2" -Force | Out-Null
New-Item -ItemType Directory -Path "temp_deploy/api" -Force | Out-Null
New-Item -ItemType Directory -Path "temp_deploy/api_staging" -Force | Out-Null

# Copy React Admin build
Copy-Item -Path "admin_react/dist/*" -Destination "temp_deploy/admin/" -Recurse -Force
Copy-Item -Path "admin_react/dist/*" -Destination "temp_deploy/admin_v2/" -Recurse -Force
if (Test-Path "admin_react/public/.htaccess") {
    Copy-Item "admin_react/public/.htaccess" "temp_deploy/admin/" -Force
    Copy-Item "admin_react/public/.htaccess" "temp_deploy/admin_v2/" -Force
}

# Copy PHP APIs
Copy-Item -Path "backend_php/api/*" -Destination "temp_deploy/api/" -Recurse -Force
Copy-Item -Path "backend_php/api_staging/*" -Destination "temp_deploy/api_staging/" -Recurse -Force

# Compress archive
if (Test-Path "update.zip") { Remove-Item "update.zip" -Force }
Compress-Archive -Path "temp_deploy/*" -DestinationPath "update.zip" -Force

# Clean up temp files
Remove-Item -Recurse -Force "temp_deploy"

Write-Host "Deployment package created successfully." -ForegroundColor Green
Write-Host "Uploading package to VPS..." -ForegroundColor Yellow

# Upload update.zip to the server
scp update.zip root@80.241.218.23:/var/www/absher/backend_php/

Write-Host "Extracting package and setting permissions on VPS..." -ForegroundColor Yellow
# Unzip and clean up
ssh root@80.241.218.23 "unzip -o /var/www/absher/backend_php/update.zip -d /var/www/absher/backend_php/ && rm -f /var/www/absher/backend_php/update.zip && chown -R www-data:www-data /var/www/absher/backend_php/ && chmod -R 755 /var/www/absher/backend_php/api/ && chmod -R 755 /var/www/absher/backend_php/api_staging/"

if (Test-Path "update.zip") { Remove-Item "update.zip" -Force }

Write-Host "Deployment finished successfully!" -ForegroundColor Green
