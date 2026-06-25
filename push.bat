@echo off
title Push code len GitHub
color 0A

echo ========================================
echo   SAIGON SPICES - Push len GitHub
echo ========================================
echo.

cd /d "%~dp0"

echo Cac file da thay doi:
git status --short
echo.

set /p COMMIT_MSG=Nhap mo ta thay doi:
if "%COMMIT_MSG%"=="" set COMMIT_MSG=chore: update

git add .
git commit -m "%COMMIT_MSG%"
git push origin main

echo.
echo ========================================
echo  PUSH THANH CONG!
echo  Code da len GitHub.
echo  Chay deploy.bat de cap nhat VPS.
echo ========================================
echo.
pause
