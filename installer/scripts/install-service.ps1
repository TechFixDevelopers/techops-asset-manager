# ============================================================
# TechOps Asset Manager - Install Windows Service
# Registers PostgreSQL and TechOps as Windows services
# Must be run as Administrator
# ============================================================

param(
    [string]$InstallDir = "C:\TechOps",
    [switch]$Uninstall
)

$ErrorActionPreference = "Stop"
$PgDir = Join-Path $InstallDir "pgsql"
$PgData = Join-Path $PgDir "data"
$PgBin = Join-Path $PgDir "bin"
$NodeDir = Join-Path $InstallDir "node"
$AppDir = Join-Path $InstallDir "app"
$LogDir = Join-Path $InstallDir "logs"
$ScriptsDir = Join-Path $InstallDir "scripts"

$PgServiceName = "TechOpsPostgreSQL"
$AppServiceName = "TechOpsAssetManager"

if ($Uninstall) {
    Write-Host "Uninstalling TechOps services..." -ForegroundColor Yellow

    # Stop and remove app service
    sc.exe stop $AppServiceName 2>$null
    sc.exe delete $AppServiceName 2>$null
    Write-Host "  Removed $AppServiceName" -ForegroundColor Green

    # Stop and remove PostgreSQL service
    & "$PgBin\pg_ctl.exe" unregister -N $PgServiceName 2>$null
    Write-Host "  Removed $PgServiceName" -ForegroundColor Green

    Write-Host "Services uninstalled." -ForegroundColor Green
    exit 0
}

if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }

Write-Host "Installing TechOps services..." -ForegroundColor Cyan

# 1. Register PostgreSQL as a Windows service
Write-Host "  Registering PostgreSQL service..." -ForegroundColor Yellow
try {
    & "$PgBin\pg_ctl.exe" unregister -N $PgServiceName 2>$null
} catch { }

& "$PgBin\pg_ctl.exe" register -N $PgServiceName -D $PgData -l (Join-Path $LogDir "postgresql.log") -S auto
if ($LASTEXITCODE -ne 0) { throw "Failed to register PostgreSQL service" }

# Start PostgreSQL service
Start-Service -Name $PgServiceName
Write-Host "  OK - PostgreSQL service installed and started" -ForegroundColor Green

# 2. Create a wrapper batch file for the app service
$wrapperBat = Join-Path $ScriptsDir "techops-service.bat"
$envFile = Join-Path $AppDir ".env.local"

# Read env vars from .env.local for the batch file
$envLines = @()
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#")) {
            $envLines += "set `"$line`""
        }
    }
}

$batContent = @"
@echo off
cd /d "$AppDir"
$($envLines -join "`r`n")
set NODE_ENV=production
"$NodeDir\node.exe" "$AppDir\server.js"
"@
Set-Content -Path $wrapperBat -Value $batContent -Encoding ASCII

# 3. Use NSSM-style approach with sc.exe
# We create the service pointing to the batch wrapper
# Using a scheduled task as an alternative since sc.exe doesn't support batch files well

# Create as a Scheduled Task that runs at startup (more reliable for Node.js)
$taskName = $AppServiceName
$action = New-ScheduledTaskAction `
    -Execute "$NodeDir\node.exe" `
    -Argument "`"$AppDir\server.js`"" `
    -WorkingDirectory $AppDir

$trigger = New-ScheduledTaskTrigger -AtStartup
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -ExecutionTimeLimit ([TimeSpan]::Zero)

# Unregister if exists
Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue

Register-ScheduledTask `
    -TaskName $taskName `
    -Action $action `
    -Trigger $trigger `
    -Principal $principal `
    -Settings $settings `
    -Description "TechOps Asset Manager - Sistema de gestion de activos IT"

# Set environment variables for the task
$envVars = @{}
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#")) {
            $parts = $line -split "=", 2
            if ($parts.Length -eq 2) {
                $envVars[$parts[0].Trim()] = $parts[1].Trim()
            }
        }
    }
}
# Set machine-level env vars so the service can read them
foreach ($kv in $envVars.GetEnumerator()) {
    [System.Environment]::SetEnvironmentVariable($kv.Key, $kv.Value, "Machine")
}

# Start the task now
Start-ScheduledTask -TaskName $taskName
Write-Host "  OK - Application service installed and started" -ForegroundColor Green

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Services installed successfully!"           -ForegroundColor Green
Write-Host "  PostgreSQL: $PgServiceName (Windows Service)" -ForegroundColor Green
Write-Host "  App: $AppServiceName (Scheduled Task at Startup)" -ForegroundColor Green
Write-Host "  Both will auto-start with Windows"         -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
