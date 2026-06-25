@echo off
title ngrok - WorkForce Manager Frontend
echo =========================================
echo  ngrok Tunnel cho Frontend (port 5173)
echo =========================================
echo.

where ngrok >nul 2>&1
if %errorlevel% neq 0 (
    echo [LOI] Khong tim thay ngrok trong PATH.
    echo       Tai ngrok tai: https://ngrok.com/download
    pause
    exit /b 1
)

echo Dang cau hinh authtoken...
ngrok config add-authtoken 3F83GXbkxGG2i2yGb5mJWIxS3F4_26WNu8TWZpQQSShQHemPo

echo.
echo Dang khoi dong tunnel...
echo Nhan Ctrl+C de dung.
echo.
ngrok http 5173
pause
