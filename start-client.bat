@echo off
title RestaurantOS Client
cd /d "%~dp0client"
echo [Client] Installing dependencies...
call npm install --silent
echo [Client] Starting on http://localhost:5173 ...
echo.
npm run dev
pause
