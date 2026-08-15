#!/bin/bash
set -e

TS=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/absher_production/$TS"
mkdir -p "$BACKUP_DIR/database" "$BACKUP_DIR/files"

echo "Creating Production DB Backup..."
mysqldump --single-transaction --routines --triggers --events --default-character-set=utf8mb4 absher_georgia_db | gzip > "$BACKUP_DIR/database/absher_georgia_db_$TS.sql.gz"

echo "Creating Production Files Backup..."
tar -czf "$BACKUP_DIR/files/admin_backup.tar.gz" -C /var/www/absher/backend_php admin
tar -czf "$BACKUP_DIR/files/api_backup.tar.gz" -C /var/www/absher/backend_php api
tar -czf "$BACKUP_DIR/files/config_backup.tar.gz" -C /var/www/absher/backend_php config
tar -czf "$BACKUP_DIR/files/apache_conf_backup.tar.gz" /etc/apache2/sites-available /etc/apache2/sites-enabled

echo "Calculating Checksums..."
cd "$BACKUP_DIR/database"
sha256sum "absher_georgia_db_$TS.sql.gz" > checksum.sha256

cd "$BACKUP_DIR/files"
sha256sum *.tar.gz > checksum.sha256

echo "BACKUP_PATH: $BACKUP_DIR"
ls -lh "$BACKUP_DIR/database" "$BACKUP_DIR/files"
echo "--- DB Checksum ---"
cat "$BACKUP_DIR/database/checksum.sha256"
echo "--- Files Checksum ---"
cat "$BACKUP_DIR/files/checksum.sha256"
