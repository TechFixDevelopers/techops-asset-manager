# ============================================================
# TechOps Asset Manager - Stop Application
# Stops the Next.js server and PostgreSQL
# ============================================================

param(
    [string]$InstallDir = "C:\TechOps"
)

$PgDir = Join-Path $InstallDir "pgsql"
$PgData = Join-Path $PgDir "data"
$PgBin = Join-Path $PgDir "bin"
$PidFile = Join-Path $InstallDir "app.pid"

Write-Host "Stopping TechOps Asset Manager..." -ForegroundColor Cyan

# 1. Stop Next.js server
if (Test-Path $PidFile) {
    $appPid = Get-Content $PidFile -ErrorAction SilentlyContinue
    if ($appPid) {
        try {
            $proc = Get-Process -Id $appPid -ErrorAction SilentlyContinue
            if ($proc) {
                Stop-Process -Id $appPid -Force
                Write-Host "  Application server stopped (PID: $appPid)" -ForegroundColor Green
            } else {
                Write-Host "  Application server not running" -ForegroundColor Gray
            }
        } catch {
            Write-Host "  Application server not running" -ForegroundColor Gray
        }
    }
    Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
} else {
    # Try to find by process name
    $procs = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
        $_.Path -like "*TechOps*"
    }
    foreach ($p in $procs) {
        Stop-Process -Id $p.Id -Force
        Write-Host "  Stopped node process (PID: $($p.Id))" -ForegroundColor Green
    }
}

# 2. Stop PostgreSQL
Write-Host "  Stopping PostgreSQL..." -ForegroundColor Yellow
try {
    & "$PgBin\pg_ctl.exe" stop -D $PgData -m fast -w 2>$null
    Write-Host "  PostgreSQL stopped" -ForegroundColor Green
} catch {
    Write-Host "  PostgreSQL was not running" -ForegroundColor Gray
}

Write-Host ""
Write-Host "  TechOps Asset Manager stopped." -ForegroundColor Green
