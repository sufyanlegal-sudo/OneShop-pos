@echo off
title OneShop POS - JK Developers Pakistan
color 0A
cd /d "%~dp0"
echo ===================================================
echo     OneShop POS - Enterprise ERP System
echo     Powered by JK Developers Pakistan
echo     Official Helpline: 03008998381
echo ===================================================
echo.
echo Starting POS Server...
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"
call npm run start
pause
