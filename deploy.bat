@echo off
title Deploy - WorkForce Manager
color 0B

echo ========================================
echo   SAIGON SPICES - Deploy len VPS
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Dang push code len GitHub...
echo.
git add .
set /p COMMIT_MSG=Nhap mo ta thay doi:
if "%COMMIT_MSG%"=="" set COMMIT_MSG=chore: update
git commit -m "%COMMIT_MSG%"
git push origin main

echo.
echo [2/3] Dang ket noi VPS va cap nhat...
echo (Nhap mat khau VPS khi duoc yeu cau)
echo.

ssh root@171.244.143.243 "cd ~/app && git pull origin main && docker compose -f docker-compose.prod.yml up -d --build"

echo.
echo ========================================
echo  DEPLOY THANH CONG!
echo  Truy cap: http://171.244.143.243
echo ========================================
echo.
pause
