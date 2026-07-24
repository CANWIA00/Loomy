#!/bin/sh
set -e

BACKUP_DIR="/backups"

if [ -z "$1" ]; then
  echo "Son backup'lari:"
  ls -1t "$BACKUP_DIR"/backup_*.sql.gz 2>/dev/null | head -5
  echo ""
  echo "Kullanim: ./restore.sh <backup_dosya_adi>"
  echo "Ornek: ./restore.sh backup_20260720_010000.sql.gz"
  exit 1
fi

BACKUP_FILE="$BACKUP_DIR/$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Dosya bulunamadi: $BACKUP_FILE"
  exit 1
fi

echo "⚠️  Mevcut DB silinecek ve geri yuklenecek!"
echo "Dosya: $BACKUP_FILE"
read -p "Devam etmek istiyor musun? (y/n): " CONFIRM

if [ "$CONFIRM" != "y" ]; then
  echo "Iptal edildi."
  exit 0
fi

echo "🔄 Geri yukleniyor..."

# Mevcut baglantilari kes
pg_terminate_backend() {
  psql -U postgres -d management_dashboard -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'management_dashboard' AND pid <> pg_backend_pid();" 2>/dev/null || true
}

pg_terminate_backend

# DB'yi sil ve yeniden olustur
dropdb -U postgres management_dashboard
createdb -U postgres management_dashboard

# Backup'i geri yukle
gunzip -c "$BACKUP_FILE" | psql -U postgres -d management_dashboard

echo "✅ Geri yukleme tamamlandi: $BACKUP_FILE"
