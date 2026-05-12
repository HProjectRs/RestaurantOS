# RestaurantOS Launcher - مشغل النظام
Write-Host "============================================" -ForegroundColor Green
Write-Host "   RestaurantOS - نظام إدارة المطاعم" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

# Check Node.js
try { node --version | Out-Null } catch {
    Write-Host "[خطأ] Node.js غير مثبت!" -ForegroundColor Red
    Write-Host "قم بتثبيته من: https://nodejs.org" -ForegroundColor Yellow
    Read-Host "Enter للخروج"
    exit
}

# Setup paths
$ServerDir = Join-Path $PSScriptRoot "server"
$ClientDir = Join-Path $PSScriptRoot "client"

Write-Host "[1/4] تجهيز قاعدة البيانات..." -ForegroundColor Cyan
Set-Location $ServerDir
npx prisma generate --no-hints 2>$null
npx prisma db push --accept-data-loss 2>$null
npx tsx prisma/seed.ts 2>$null

Write-Host "[2/4] بدء السيرفر (port 3001)..." -ForegroundColor Cyan
$serverJob = Start-Job -Name "RestaurantOS-Server" -ScriptBlock {
    param($dir)
    Set-Location $dir
    npx tsx src/index.ts
} -ArgumentList $ServerDir
Start-Sleep -Seconds 5

Write-Host "[3/4] بدء الواجهة (port 5173)..." -ForegroundColor Cyan
$clientJob = Start-Job -Name "RestaurantOS-Client" -ScriptBlock {
    param($dir)
    Set-Location $dir
    npm run dev
} -ArgumentList $ClientDir
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  ✅ تم التشغيل بنجاح!" -ForegroundColor Green
Write-Host ""
Write-Host "  📋 الواجهة:     http://localhost:5173" -ForegroundColor White
Write-Host "  ⚙️  السيرفر:    http://localhost:3001" -ForegroundColor White
Write-Host "  👨‍🍳 شاشة الطاهي: http://localhost:5173/kitchen" -ForegroundColor White
Write-Host ""
Write-Host "  🔑 بيانات الدخول:" -ForegroundColor Yellow
Write-Host "     البريد:    admin@cafe.com" -ForegroundColor White
Write-Host "     كلمة السر: admin123" -ForegroundColor White
Write-Host ""
Write-Host "  🛑 لإيقاف: إضغط Enter" -ForegroundColor Red
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

Read-Host

Write-Host "جارٍ إيقاف الخدمات..." -ForegroundColor Yellow
Get-Job -Name "RestaurantOS-Server" -ErrorAction SilentlyContinue | Stop-Job
Get-Job -Name "RestaurantOS-Client" -ErrorAction SilentlyContinue | Stop-Job
Get-Job -Name "RestaurantOS-Server" -ErrorAction SilentlyContinue | Remove-Job
Get-Job -Name "RestaurantOS-Client" -ErrorAction SilentlyContinue | Remove-Job

# Kill any orphaned node processes on our ports
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -match "tsx|vite" 
} | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "✅ تم الإيقاف" -ForegroundColor Green
