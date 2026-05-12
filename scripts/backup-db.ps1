# Database backup script for RestaurantOS (Windows PowerShell)
# Uses pg_dump via Docker to create timestamped backups
# Keeps the last 7 backups and deletes older ones

$ErrorActionPreference = "Stop"

# Configuration
$BackupDir = ".\backups"
$DbContainer = "restaurantos-db"
$DbName = "restaurantos"
$DbUser = "postgres"
$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$BackupFile = Join-Path $BackupDir "restaurantos_$Timestamp.sql.gz"
$RetentionCount = 7

# Create backup directory if it doesn't exist
New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null

Write-Host "=========================================="
Write-Host " RestaurantOS Database Backup"
Write-Host "=========================================="
Write-Host "Timestamp: $Timestamp"
Write-Host "Database:  $DbName"
Write-Host "Container: $DbContainer"
Write-Host "Output:    $BackupFile"
Write-Host "------------------------------------------"

# Check if Docker is running
docker info > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error: Docker is not running."
    exit 1
}

# Check if the container exists
$containerRunning = docker ps --format '{{.Names}}' | Select-String -Pattern "^$DbContainer$"
if (-not $containerRunning) {
    Write-Host "❌ Error: Container '$DbContainer' is not running."
    Write-Host "   Start it with: docker-compose up -d postgres"
    exit 1
}

# Perform the backup
Write-Host "📦 Running pg_dump..."
try {
    docker exec $DbContainer pg_dump -U $DbUser $DbName | gzip > $BackupFile
    $backupInfo = Get-Item $BackupFile
    $backupSize = "{0:N2} MB" -f ($backupInfo.Length / 1MB)
    Write-Host "✅ Backup created successfully ($backupSize): $BackupFile"
} catch {
    Write-Host "❌ Error: Backup failed."
    Remove-Item -Path $BackupFile -Force -ErrorAction SilentlyContinue
    exit 1
}

# Clean up old backups
Write-Host "🧹 Cleaning up old backups (keeping last $RetentionCount)..."
$backups = Get-ChildItem -Path $BackupDir -Filter "restaurantos_*.sql.gz" | Sort-Object Name -Descending
if ($backups.Count -gt $RetentionCount) {
    $backups | Select-Object -Skip $RetentionCount | ForEach-Object {
        Remove-Item -Path $_.FullName -Force
        Write-Host "   Removed: $($_.Name)"
    }
}

Write-Host "------------------------------------------"
Write-Host "✅ Backup completed successfully!"
Write-Host "   File: $BackupFile"
Write-Host "   Date: $(Get-Date)"
Write-Host "=========================================="
