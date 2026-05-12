#!/bin/bash
# Database backup script for RestaurantOS
# Uses pg_dump to create timestamped backups
# Keeps the last 7 backups and deletes older ones

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
DB_CONTAINER="${DB_CONTAINER:-restaurantos-db}"
DB_NAME="${DB_NAME:-restaurantos}"
DB_USER="${DB_USER:-postgres}"
TIMESTAMP=$(date +'%Y-%m-%d_%H-%M-%S')
BACKUP_FILE="${BACKUP_DIR}/restaurantos_${TIMESTAMP}.sql.gz"
RETENTION_COUNT=7

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

echo "=========================================="
echo " RestaurantOS Database Backup"
echo "=========================================="
echo "Timestamp: ${TIMESTAMP}"
echo "Database:  ${DB_NAME}"
echo "Container: ${DB_CONTAINER}"
echo "Output:    ${BACKUP_FILE}"
echo "------------------------------------------"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Error: Docker is not running."
  exit 1
fi

# Check if the container exists
if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
  echo "❌ Error: Container '${DB_CONTAINER}' is not running."
  echo "   Start it with: docker-compose up -d postgres"
  exit 1
fi

# Perform the backup
echo "📦 Running pg_dump..."
if docker exec "${DB_CONTAINER}" pg_dump -U "${DB_USER}" "${DB_NAME}" | gzip > "${BACKUP_FILE}"; then
  BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
  echo "✅ Backup created successfully (${BACKUP_SIZE}): ${BACKUP_FILE}"
else
  echo "❌ Error: Backup failed."
  rm -f "${BACKUP_FILE}"
  exit 1
fi

# Clean up old backups (keep only the last RETENTION_COUNT)
echo "🧹 Cleaning up old backups (keeping last ${RETENTION_COUNT})..."
ls -t "${BACKUP_DIR}"/restaurantos_*.sql.gz 2>/dev/null | tail -n +$((RETENTION_COUNT + 1)) | while read -r old_backup; do
  rm -f "${old_backup}"
  echo "   Removed: ${old_backup}"
done

echo "------------------------------------------"
echo "✅ Backup completed successfully!"
echo "   File: ${BACKUP_FILE}"
echo "   Date: $(date)"
echo "=========================================="
