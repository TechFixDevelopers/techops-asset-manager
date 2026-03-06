# ============================================================
# TechOps Asset Manager - Build Installer
# Downloads dependencies, builds the app, and prepares
# the staging directory for Inno Setup compilation.
#
# Usage:
#   .\build-installer.ps1
#   .\build-installer.ps1 -SkipDownload   (if already downloaded)
#   .\build-installer.ps1 -SignCert "path\to\cert.pfx" -SignPassword "pass"
#
# After running, open techops-setup.iss in Inno Setup and compile.
# ============================================================

param(
    [switch]$SkipDownload,
    [switch]$SkipBuild,
    [string]$SignCert,
    [string]$SignPassword,
    [string]$NodeVersion = "20.18.3",
    [string]$PgVersion = "15.12-1"
)

$ErrorActionPreference = "Stop"
$InstallerDir = $PSScriptRoot
$ProjectRoot = Split-Path $InstallerDir -Parent
$StagingDir = Join-Path $InstallerDir "staging"
$DownloadsDir = Join-Path $InstallerDir "downloads"
$OutputDir = Join-Path $InstallerDir "output"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  TechOps Asset Manager - Installer Builder"                  -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# ---- Create directories ----
foreach ($dir in @($StagingDir, $DownloadsDir, $OutputDir, "$InstallerDir\icon")) {
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
}

# ---- Step 1: Download Node.js portable ----
if (-not $SkipDownload) {
    $nodeZip = Join-Path $DownloadsDir "node-v${NodeVersion}-win-x64.zip"
    $nodeUrl = "https://nodejs.org/dist/v${NodeVersion}/node-v${NodeVersion}-win-x64.zip"

    if (-not (Test-Path $nodeZip)) {
        Write-Host "[1/5] Downloading Node.js v${NodeVersion}..." -ForegroundColor Yellow
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeZip -UseBasicParsing
        Write-Host "  Downloaded: $nodeZip" -ForegroundColor Green
    } else {
        Write-Host "[1/5] Node.js already downloaded" -ForegroundColor Gray
    }

    # Extract
    $nodeStaging = Join-Path $StagingDir "node"
    if (Test-Path $nodeStaging) { Remove-Item $nodeStaging -Recurse -Force }
    Write-Host "  Extracting Node.js..." -ForegroundColor Yellow
    Expand-Archive -Path $nodeZip -DestinationPath $StagingDir -Force
    Rename-Item (Join-Path $StagingDir "node-v${NodeVersion}-win-x64") $nodeStaging
    Write-Host "  OK" -ForegroundColor Green
} else {
    Write-Host "[1/5] Skipping Node.js download" -ForegroundColor Gray
}

# ---- Step 2: Download PostgreSQL portable ----
if (-not $SkipDownload) {
    $pgZip = Join-Path $DownloadsDir "postgresql-${PgVersion}-windows-x64-binaries.zip"
    $pgUrl = "https://get.enterprisedb.com/postgresql/postgresql-${PgVersion}-windows-x64-binaries.zip"

    if (-not (Test-Path $pgZip)) {
        Write-Host "[2/5] Downloading PostgreSQL ${PgVersion}..." -ForegroundColor Yellow
        Invoke-WebRequest -Uri $pgUrl -OutFile $pgZip -UseBasicParsing
        Write-Host "  Downloaded: $pgZip" -ForegroundColor Green
    } else {
        Write-Host "[2/5] PostgreSQL already downloaded" -ForegroundColor Gray
    }

    # Extract
    $pgStaging = Join-Path $StagingDir "pgsql"
    if (Test-Path $pgStaging) { Remove-Item $pgStaging -Recurse -Force }
    Write-Host "  Extracting PostgreSQL..." -ForegroundColor Yellow
    Expand-Archive -Path $pgZip -DestinationPath $StagingDir -Force
    Write-Host "  OK" -ForegroundColor Green
} else {
    Write-Host "[2/5] Skipping PostgreSQL download" -ForegroundColor Gray
}

# ---- Step 3: Build Next.js app ----
if (-not $SkipBuild) {
    Write-Host "[3/5] Building Next.js application..." -ForegroundColor Yellow
    Push-Location $ProjectRoot
    try {
        & npm run build
        if ($LASTEXITCODE -ne 0) { throw "Build failed" }
    } finally {
        Pop-Location
    }
    Write-Host "  OK - Build complete" -ForegroundColor Green
} else {
    Write-Host "[3/5] Skipping build" -ForegroundColor Gray
}

# ---- Step 4: Stage application files ----
Write-Host "[4/5] Staging application files..." -ForegroundColor Yellow
$appStaging = Join-Path $StagingDir "app"
if (Test-Path $appStaging) { Remove-Item $appStaging -Recurse -Force }
New-Item -ItemType Directory -Path $appStaging -Force | Out-Null

# Copy standalone build
$standaloneSrc = Join-Path $ProjectRoot ".next\standalone"
if (-not (Test-Path $standaloneSrc)) { throw ".next/standalone not found. Run 'npm run build' first." }
Copy-Item -Path "$standaloneSrc\*" -Destination $appStaging -Recurse -Force

# Copy static assets
$staticSrc = Join-Path $ProjectRoot ".next\static"
$staticDest = Join-Path $appStaging ".next\static"
if (Test-Path $staticSrc) {
    New-Item -ItemType Directory -Path $staticDest -Force | Out-Null
    Copy-Item -Path "$staticSrc\*" -Destination $staticDest -Recurse -Force
}

# Copy public
$publicSrc = Join-Path $ProjectRoot "public"
if (Test-Path $publicSrc) {
    Copy-Item -Path $publicSrc -Destination (Join-Path $appStaging "public") -Recurse -Force
}

# Copy drizzle migrations and schema
$drizzleSrc = Join-Path $ProjectRoot "drizzle"
if (Test-Path $drizzleSrc) {
    Copy-Item -Path $drizzleSrc -Destination (Join-Path $appStaging "drizzle") -Recurse -Force
}
$schemaSrc = Join-Path $ProjectRoot "src\lib\db\schema.ts"
$schemaDest = Join-Path $appStaging "src\lib\db"
New-Item -ItemType Directory -Path $schemaDest -Force | Out-Null
Copy-Item $schemaSrc $schemaDest -Force

# Copy config files needed for drizzle-kit and seed
foreach ($f in @("drizzle.config.ts", "package.json", "tsconfig.json")) {
    $src = Join-Path $ProjectRoot $f
    if (Test-Path $src) { Copy-Item $src (Join-Path $appStaging $f) -Force }
}

# Copy scripts
$scriptsSrc = Join-Path $ProjectRoot "scripts"
if (Test-Path $scriptsSrc) {
    Copy-Item -Path $scriptsSrc -Destination (Join-Path $appStaging "scripts") -Recurse -Force
}

Write-Host "  OK - App staged" -ForegroundColor Green

# ---- Create launcher batch files ----
$startBat = @"
@echo off
echo Starting TechOps Asset Manager...
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\start-techops.ps1" -InstallDir "%~dp0."
pause
"@
Set-Content -Path (Join-Path $StagingDir "start-techops.bat") -Value $startBat -Encoding ASCII

$stopBat = @"
@echo off
echo Stopping TechOps Asset Manager...
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\stop-techops.ps1" -InstallDir "%~dp0."
pause
"@
Set-Content -Path (Join-Path $StagingDir "stop-techops.bat") -Value $stopBat -Encoding ASCII

# ---- Create default icon if not exists ----
$iconPath = Join-Path $InstallerDir "icon\techops.ico"
if (-not (Test-Path $iconPath)) {
    Write-Host "  Note: No icon found at icon\techops.ico - using default" -ForegroundColor Yellow
    # Create a minimal .ico placeholder (will use default Windows icon)
    # Replace this with your actual .ico file
    [byte[]]$emptyIco = @(0,0,1,0,1,0,16,16,0,0,1,0,32,0,104,4,0,0,22,0,0,0)
    [System.IO.File]::WriteAllBytes($iconPath, $emptyIco)
}

# ---- Create license.txt if not exists ----
$licensePath = Join-Path $InstallerDir "license.txt"
if (-not (Test-Path $licensePath)) {
    $licenseText = @"
TechOps Asset Manager
Copyright (c) 2025 PixelIT

Este software es propiedad de PixelIT y se distribuye
exclusivamente para uso interno corporativo.

Todos los derechos reservados.

Al instalar este software, usted acepta:
- Utilizar el software unicamente para fines corporativos autorizados
- No distribuir ni copiar el software sin autorizacion
- Mantener la confidencialidad de los datos gestionados
"@
    Set-Content -Path $licensePath -Value $licenseText -Encoding UTF8
}

# ---- Step 5: Summary ----
Write-Host ""
Write-Host "[5/5] Staging complete!" -ForegroundColor Green
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Staging directory: $StagingDir" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Contents:" -ForegroundColor White
Write-Host "    staging\app\    - Next.js standalone build" -ForegroundColor White
Write-Host "    staging\node\   - Node.js $NodeVersion portable" -ForegroundColor White
Write-Host "    staging\pgsql\  - PostgreSQL $PgVersion portable" -ForegroundColor White
Write-Host ""
Write-Host "  Next steps:" -ForegroundColor Yellow
Write-Host "    1. (Optional) Replace icon\techops.ico with your logo" -ForegroundColor White
Write-Host "    2. Open techops-setup.iss in Inno Setup Compiler" -ForegroundColor White
Write-Host "    3. Click Build > Compile" -ForegroundColor White
Write-Host "    4. Installer will be at: output\TechOps-Asset-Manager-Setup-v1.0.0.exe" -ForegroundColor White

# ---- Optional: Sign the installer ----
if ($SignCert) {
    Write-Host ""
    Write-Host "  Signing:" -ForegroundColor Yellow
    $installerExe = Join-Path $OutputDir "TechOps-Asset-Manager-Setup-v1.0.0.exe"
    if (Test-Path $installerExe) {
        $signArgs = "sign /f `"$SignCert`" /tr http://timestamp.digicert.com /td sha256 /fd sha256"
        if ($SignPassword) { $signArgs += " /p `"$SignPassword`"" }
        $signArgs += " `"$installerExe`""
        Start-Process "signtool" -ArgumentList $signArgs -Wait -NoNewWindow
        Write-Host "  OK - Installer signed" -ForegroundColor Green
    } else {
        Write-Host "  Installer not found yet. Compile with Inno Setup first, then sign." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  Done! Ready to compile with Inno Setup." -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
