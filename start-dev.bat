@echo off
title WorkForce Manager - Dev Launcher
echo ============================================
echo   WorkForce Manager - Starting Dev Servers
echo ============================================
echo.

echo [1/2] Starting Backend (ASP.NET Core 9)...
start "Backend - WorkForce Manager" /MIN cmd /k "cd /d "%~dp0" && dotnet run --project backend/src/WorkForceManager.WebApi"

echo Waiting for backend to initialize...
timeout /t 8 /nobreak >nul

echo [2/2] Starting Frontend (Vite + React)...
start "Frontend - WorkForce Manager" /MIN cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ============================================
echo   Backend  : http://localhost:5244/swagger
echo   Frontend : http://localhost:5173
echo ============================================
echo.
echo Ca hai server da duoc khoi dong (thu nho o taskbar).
echo KHONG dong cac cua so CMD "Backend" va "Frontend"!
echo.
echo Nhan phim bat ky de dong launcher nay...
pause >nul
