# Script tu dong dong goi ung dung WorkForce Manager thanh file chay .exe doc lap kem SQLite
# He dieu hanh yeu cau: Windows voi PowerShell 5.1+ va da cai dat Node.js, .NET 9 SDK.

$ErrorActionPreference = "Stop"
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "BAT DAU DONG GOI UNG DUNG WORKFORCE MANAGER CHO WINDOWS-X64" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green

# 1. Dinh nghia cac duong dan
$ProjectRoot = $PSScriptRoot
$FrontendDir = Join-Path $ProjectRoot "frontend"
$BackendDir = Join-Path $ProjectRoot "backend"
$WebApiProj = Join-Path $BackendDir "src/WorkForceManager.WebApi/WorkForceManager.WebApi.csproj"
$WebApiWwwRoot = Join-Path $BackendDir "src/WorkForceManager.WebApi/wwwroot"
$PublishDir = Join-Path $ProjectRoot "publish"
$ZipPath = Join-Path $ProjectRoot "WorkForceManager-Windows-x64.zip"

# Tat cac tien trinh dang chay truoc do de tranh khoa file
Get-Process -Name "WorkForceManager*" -ErrorAction SilentlyContinue | Stop-Process -Force
dotnet build-server shutdown

# Don dep thu muc cu
if (Test-Path $PublishDir) {
    Write-Host "Dang don dep thu muc publish cu..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $PublishDir
}
if (Test-Path $ZipPath) {
    Write-Host "Dang xoa file zip cu..." -ForegroundColor Yellow
    Remove-Item -Force $ZipPath
}

# 2. Build Frontend React
Write-Host "`n[1/5] Dang build Frontend..." -ForegroundColor Cyan
Push-Location $FrontendDir
try {
    Write-Host "Dang cai dat thu vien Frontend (neu can)..." -ForegroundColor Gray
    npm install --no-audit --no-fund
    
    Write-Host "Dang chay build Frontend..." -ForegroundColor Gray
    npm run build
}
finally {
    Pop-Location
}

# 3. Copy Frontend da build sang Backend wwwroot
Write-Host "`n[2/5] Dang copy Frontend sang Backend wwwroot..." -ForegroundColor Cyan
if (Test-Path $WebApiWwwRoot) {
    Remove-Item -Recurse -Force $WebApiWwwRoot
}
New-Item -ItemType Directory -Path $WebApiWwwRoot | Out-Null
Copy-Item -Recurse -Force "$FrontendDir/dist/*" $WebApiWwwRoot
# Tao san thu muc uploads trong wwwroot
New-Item -ItemType Directory -Path (Join-Path $WebApiWwwRoot "uploads") -ErrorAction SilentlyContinue | Out-Null

# 4. Publish Backend thanh single-file .exe tu chay (win-x64)
Write-Host "`n[3/5] Dang bien dich Backend thanh file .exe (win-x64)..." -ForegroundColor Cyan
dotnet publish $WebApiProj `
    -c Release `
    -r win-x64 `
    --self-contained true `
    -p:PublishSingleFile=true `
    -p:PublishReadyToRun=true `
    -p:EnableCompressionInSingleFileBundle=true `
    -p:UseSharedCompilation=false `
    -o $PublishDir

# Shutdown build server mot lan nua de dam bao file duoc giai phong
dotnet build-server shutdown
Start-Sleep -Seconds 2

# Doi ten file chay thanh WorkForceManager.exe
$OldExe = Join-Path $PublishDir "WorkForceManager.WebApi.exe"
if (Test-Path $OldExe) {
    Rename-Item -Path $OldExe -NewName "WorkForceManager.exe" -Force
}

# Xoa cac file cau hinh dev
$DevSettings = Join-Path $PublishDir "appsettings.Development.json"
if (Test-Path $DevSettings) {
    Remove-Item -Force $DevSettings
}

# 5. Ghi de file appsettings.json
Write-Host "`n[4/5] Dang ghi de appsettings.json..." -ForegroundColor Cyan
$ClientSettings = @{
    "DatabaseProvider" = "Sqlite"
    "ConnectionStrings" = @{
        "DefaultConnection" = "Data Source=workforce.db"
    }
    "JwtSettings" = @{
        "Secret" = "WorkForceManager_StandAlone_Secret_Key_At_Least_32_Chars_Long_Please_Keep_Secure"
        "Issuer" = "WorkForceManager"
        "Audience" = "WorkForceManagerClient"
        "AccessTokenExpiryMinutes" = 120
        "RefreshTokenExpiryDays" = 7
    }
    "Seed" = @{
        "Enabled" = $true
    }
    "EnableSwagger" = $true
    "Logging" = @{
        "LogLevel" = @{
            "Default" = "Information"
            "Microsoft.AspNetCore" = "Warning"
            "Microsoft.EntityFrameworkCore" = "Warning"
        }
    }
    "AllowedHosts" = "*"
}

$ClientSettingsJson = $ClientSettings | ConvertTo-Json -Depth 5
[System.IO.File]::WriteAllText((Join-Path $PublishDir "appsettings.json"), $ClientSettingsJson, [System.Text.Encoding]::UTF8)

# 6. Nen thanh file .zip
Write-Host "`n[5/5] Dang nen san pham thanh file .zip..." -ForegroundColor Cyan
Compress-Archive -Path "$PublishDir\*" -DestinationPath $ZipPath -Force

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "DONG GOI HOAN TAT THANH CONG!" -ForegroundColor Green
Write-Host "File dong goi tai: $ZipPath" -ForegroundColor Yellow
Write-Host "Huong dan: Giai nen file .zip va chay 'WorkForceManager.exe'" -ForegroundColor Cyan
Write-Host "Ung dung se tu dong tao CSDL SQLite va chay tai cong mac dinh." -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green
