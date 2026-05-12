@echo off
title RestaurantOS Launch
cd /d "%~dp0"

echo ============================================
echo    RestaurantOS - نظام إدارة المطاعم
echo ============================================
echo.

:: Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [خطأ] Node.js غير مثبت. قم بتثبيته من https://nodejs.org
    pause
    exit /b
)

:: Setup Database
echo [1/4] تجهيز قاعدة البيانات...
cd /d "%~dp0server"
call npx prisma generate --no-hints 2>nul
call npx prisma db push --accept-data-loss 2>nul
call npx tsx prisma/seed.ts 2>nul

:: Start Server (opens new window)
echo [2/4] بدء السيرفر (port 3001)...
start "RestaurantOS Server" cmd /c "cd /d "%~dp0server" && title RestaurantOS Server && echo [Server] Starting... && npx tsx src/index.ts && pause"

:: Wait for server
timeout /t 5 /nobreak >nul

:: Start Client (opens new window)
echo [3/4] بدء الواجهة (port 5173)...
start "RestaurantOS Client" cmd /c "cd /d "%~dp0client" && title RestaurantOS Client && echo [Client] Starting... && npm run dev && pause"

timeout /t 3 /nobreak >nul

echo.
echo ============================================
echo  ✅  تم التشغيل بنجاح!
echo.
echo  📋  الواجهة:     http://localhost:5173
echo  ⚙️   السيرفر:    http://localhost:3001
echo  👨‍🍳  شاشة الطاهي: http://localhost:5173/kitchen
echo.
echo  🔑  بيانات الدخول:
echo      البريد:    admin@cafe.com
echo      كلمة السر: admin123
echo.
echo  🛑  لإيقاف: اغلق نوافذ Server و Client
echo ============================================
echo.
pause
