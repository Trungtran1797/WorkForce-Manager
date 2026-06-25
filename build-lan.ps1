# ============================================================
# build-lan.ps1 - Build & chạy WorkForce Manager cho LAN
# Dùng: Click chuột phải -> "Run with PowerShell"
#       hoặc: .\build-lan.ps1
# ============================================================

$root     = $PSScriptRoot
$frontend = Join-Path $root "frontend"
$backend  = Join-Path $root "backend"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  WorkForce Manager - LAN Deploy Tool  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Lay IP LAN cua may nay
$lanIP = (Get-NetIPAddress -AddressFamily IPv4 |
          Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.*" } |
          Select-Object -First 1).IPAddress

# ---- Buoc 1: Build frontend ----
Write-Host "[1/3] Build frontend React..." -ForegroundColor Yellow
Set-Location $frontend
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "FAILED: npm run build that bai!" -ForegroundColor Red
    Read-Host "Nhan Enter de thoat"
    exit 1
}

# ---- Buoc 2: Kill backend cu neu dang chay ----
Write-Host ""
Write-Host "[2/3] Tat backend cu (neu co)..." -ForegroundColor Yellow
Get-Process -Name "WorkForceManager.WebApi" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2
Write-Host "     San sang!" -ForegroundColor Green

# ---- Buoc 3: Chay backend ----
Write-Host ""
Write-Host "[3/3] Khoi dong backend tren LAN..." -ForegroundColor Yellow
Write-Host ""
Write-Host "  >> Cac may trong mang LAN truy cap tai:" -ForegroundColor Green
Write-Host "     http://$lanIP`:5244" -ForegroundColor White -BackgroundColor DarkGreen
Write-Host ""
Write-Host "  >> Dang nhap demo:" -ForegroundColor Cyan
Write-Host "     Admin    : admin / Admin@123"
Write-Host "     Manager  : manager / Manager@123"
Write-Host "     Employee : employee / Employee@123"
Write-Host ""
Write-Host "  Nhan Ctrl+C de dung server." -ForegroundColor Gray
Write-Host "========================================"
Write-Host ""

Set-Location $backend
dotnet run --project "src\WorkForceManager.WebApi" --launch-profile lan
