# ============================================================
# TechOps Asset Manager - Start Application
# Starts PostgreSQL and the Next.js server
# ============================================================

param(
    [string]$InstallDir = "C:\TechOps"
)

$ErrorActionPreference = "Stop"
$PgDir = Join-Path $InstallDir "pgsql"
$PgData = Join-Path $PgDir "data"
$PgBin = Join-Path $PgDir "bin"
$NodeDir = Join-Path $InstallDir "node"
$AppDir = Join-Path $InstallDir "app"
$LogDir = Join-Path $InstallDir "logs"
$EnvFile = Join-Path $AppDir ".env.local"

if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }

Write-Host "Starting TechOps Asset Manager..." -ForegroundColor Cyan

# 1. Start PostgreSQL if not running
$pgRunning = $false
try {
    & "$PgBin\pg_ctl.exe" status -D $PgData 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) { $pgRunning = $true }
} catch { }

if (-not $pgRunning) {
    Write-Host "  Starting PostgreSQL..." -ForegroundColor Yellow
    Start-Process -FilePath "$PgBin\pg_ctl.exe" `
        -ArgumentList "start", "-D", $PgData, "-l", (Join-Path $LogDir "postgresql.log"), "-w" `
        -NoNewWindow -Wait
    Start-Sleep -Seconds 2
    Write-Host "  PostgreSQL started" -ForegroundColor Green
} else {
    Write-Host "  PostgreSQL already running" -ForegroundColor Gray
}

# 2. Load environment variables from .env.local
if (Test-Path $EnvFile) {
    Get-Content $EnvFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#")) {
            $parts = $line -split "=", 2
            if ($parts.Length -eq 2) {
                [System.Environment]::SetEnvironmentVariable($parts[0].Trim(), $parts[1].Trim(), "Process")
            }
        }
    }
}

# 3. Start Next.js server
Write-Host "  Starting application server on port $env:PORT..." -ForegroundColor Yellow
$env:PATH = "$NodeDir;$env:PATH"
$env:NODE_ENV = "production"
if (-not $env:PORT) { $env:PORT = "3000" }
if (-not $env:HOSTNAME) { $env:HOSTNAME = "0.0.0.0" }

$appLog = Join-Path $LogDir "app.log"
$appErrLog = Join-Path $LogDir "app-error.log"

$process = Start-Process -FilePath "$NodeDir\node.exe" `
    -ArgumentList (Join-Path $AppDir "server.js") `
    -WorkingDirectory $AppDir `
    -RedirectStandardOutput $appLog `
    -RedirectStandardError $appErrLog `
    -NoNewWindow -PassThru

# Save PID for stop script
$process.Id | Out-File -FilePath (Join-Path $InstallDir "app.pid") -Encoding UTF8

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  TechOps Asset Manager running!"             -ForegroundColor Green
Write-Host "  URL: http://localhost:$env:PORT"            -ForegroundColor Green
Write-Host "  PID: $($process.Id)"                        -ForegroundColor Green
Write-Host "  Logs: $LogDir"                              -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
