@echo off
title WorkForce Manager - Khoi dong he thong
color 0A

echo ========================================
echo   SAIGON SPICES - WorkForce Manager
echo ========================================
echo.

echo [1/2] Dang khoi dong Backend (API)...
start "Backend API" cmd /k "cd /d "%~dp0" && dotnet run --project backend/src/WorkForceManager.WebApi"

timeout /t 5 /nobreak >nul

echo [2/2] Dang khoi dong Frontend (UI)...
start "Frontend UI" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ========================================
echo  He thong dang khoi dong...
echo  Backend : http://localhost:5244/swagger
echo  Frontend: http://localhost:5173
echo ========================================
echo.
echo Doi 10 giay roi mo trinh duyet...
timeout /t 10 /nobreak >nul

start "" "http://localhost:5173"

echo.
echo Nhan phim bat ky de dong cua so nay.
echo (2 cua so Backend va Frontend van chay)
pause >nul
