#!/bin/sh
set -e

BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "📦 Backup basliyor: $BACKUP_FILE"

pg_dump -U postgres -d management_dashboard | gzip > "$BACKUP_FILE"

echo "✅ Backup tamamlandi: $BACKUP_FILE"

# Son 10 backup'i tut, eskilerini sil
cd "$BACKUP_DIR"
ls -1t backup_*.sql.gz | tail -n +11 | xargs -r rm --
echo "🗑️  Eski backup'lar temizlendi (son 10 tanesi korundu)"
