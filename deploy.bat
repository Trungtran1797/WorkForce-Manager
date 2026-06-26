@echo off
title Deploy - WorkForce Manager
color 0B

echo ========================================
echo   SAIGON SPICES - Deploy len VPS
echo   http://171.244.143.243
echo ========================================
echo.

cd /d "%~dp0"

:: ── Kiem tra git status ──────────────────────────────
echo [1/4] Kiem tra thay doi code...
git status --short
echo.

:: ── Commit va push ───────────────────────────────────
set /p COMMIT_MSG=Nhap mo ta thay doi (Enter de bo qua neu khong co gi moi):
if "%COMMIT_MSG%"=="" goto skip_commit

git add .
git commit -m "%COMMIT_MSG%"
if errorlevel 1 (
    echo [!] Commit that bai hoac khong co gi de commit, tiep tuc push...
)
git push origin main
if errorlevel 1 (
    echo [!] Push that bai. Kiem tra ket noi mang hoac SSH key GitHub.
    pause
    exit /b 1
)
echo [OK] Da push code len GitHub.
goto deploy_vps

:skip_commit
echo [i] Bo qua commit, chi deploy code hien tai tren VPS.

:deploy_vps
echo.
echo [2/4] Ket noi VPS va cap nhat code...
echo (Yeu cau: SSH key da duoc cau hinh cho root@171.244.143.243)
echo.

ssh -o ConnectTimeout=15 root@171.244.143.243 "cd ~/app && git pull origin main"
if errorlevel 1 (
    echo [!] Khong ket noi duoc VPS hoac git pull that bai.
    echo     Kiem tra: ssh root@171.244.143.243
    pause
    exit /b 1
)
echo [OK] Da cap nhat code tren VPS.

echo.
echo [3/4] Build va khoi dong lai Docker containers...
echo (Qua trinh nay co the mat 5-10 phut, khong dung cache cu...)
echo.

ssh -o ConnectTimeout=600 root@171.244.143.243 "cd ~/app && docker compose -f docker-compose.prod.yml down && docker compose -f docker-compose.prod.yml build --no-cache && docker compose -f docker-compose.prod.yml up -d"
if errorlevel 1 (
    echo [!] Docker build/start gap loi.
    echo     Xem log: ssh root@171.244.143.243 "docker logs workforce-api --tail 50"
    pause
    exit /b 1
)

echo.
echo [4/4] Kiem tra trang thai containers...
ssh root@171.244.143.243 "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"

echo.
echo ========================================
echo  DEPLOY THANH CONG!
echo  Truy cap: http://171.244.143.243
echo  Swagger:  http://171.244.143.243/swagger
echo  Tai khoan demo:
echo    Admin   : admin / Admin@123
echo    Manager : manager / Manager@123
echo    Employee: employee / Employee@123
echo ========================================
echo.
pause
