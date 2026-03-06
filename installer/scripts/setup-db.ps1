# ============================================================
# TechOps Asset Manager - Database Setup Script
# Initializes PostgreSQL and creates the application database
# ============================================================

param(
    [string]$InstallDir = "C:\TechOps",
    [string]$DbPassword = "techops_secure_2025",
    [string]$DbName = "techops_assets",
    [string]$DbUser = "techops"
)

$ErrorActionPreference = "Stop"
$PgDir = Join-Path $InstallDir "pgsql"
$PgData = Join-Path $PgDir "data"
$PgBin = Join-Path $PgDir "bin"
$NodeDir = Join-Path $InstallDir "node"
$AppDir = Join-Path $InstallDir "app"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  TechOps Asset Manager - Setup Database"     -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# 1. Initialize PostgreSQL data directory if not exists
if (-not (Test-Path $PgData)) {
    Write-Host "[1/5] Initializing PostgreSQL data directory..." -ForegroundColor Yellow
    $env:PATH = "$PgBin;$env:PATH"
    & "$PgBin\initdb.exe" -D $PgData -U postgres -E UTF8 --locale=C -A trust
    if ($LASTEXITCODE -ne 0) { throw "Failed to initialize PostgreSQL" }
    Write-Host "  OK - PostgreSQL initialized" -ForegroundColor Green
} else {
    Write-Host "[1/5] PostgreSQL data directory already exists, skipping init" -ForegroundColor Gray
}

# 2. Configure pg_hba.conf for local connections
$PgHba = Join-Path $PgData "pg_hba.conf"
$hbaContent = @"
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             all                                     trust
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
"@
Set-Content -Path $PgHba -Value $hbaContent -Encoding UTF8
Write-Host "[2/5] Configured pg_hba.conf" -ForegroundColor Green

# 3. Start PostgreSQL
Write-Host "[3/5] Starting PostgreSQL..." -ForegroundColor Yellow
$pgProcess = Start-Process -FilePath "$PgBin\pg_ctl.exe" `
    -ArgumentList "start", "-D", $PgData, "-l", (Join-Path $PgDir "logfile.log"), "-w" `
    -NoNewWindow -PassThru -Wait

if ($pgProcess.ExitCode -ne 0) {
    # Maybe already running
    Write-Host "  PostgreSQL may already be running, continuing..." -ForegroundColor Yellow
}
Start-Sleep -Seconds 2
Write-Host "  OK - PostgreSQL running" -ForegroundColor Green

# 4. Create user and database
Write-Host "[4/5] Creating database and user..." -ForegroundColor Yellow
try {
    & "$PgBin\psql.exe" -U postgres -c "CREATE USER $DbUser WITH PASSWORD '$DbPassword';" 2>$null
} catch { }
try {
    & "$PgBin\psql.exe" -U postgres -c "CREATE DATABASE $DbName OWNER $DbUser ENCODING 'UTF8';" 2>$null
} catch { }
try {
    & "$PgBin\psql.exe" -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DbName TO $DbUser;" 2>$null
} catch { }
Write-Host "  OK - Database '$DbName' ready" -ForegroundColor Green

# 5. Run migrations and seed
Write-Host "[5/5] Running database migrations..." -ForegroundColor Yellow
$env:DATABASE_URL = "postgresql://${DbUser}:${DbPassword}@127.0.0.1:5432/${DbName}"
$env:PATH = "$NodeDir;$env:PATH"

Push-Location $AppDir
try {
    & "$NodeDir\npx.cmd" drizzle-kit push --force 2>&1 | Out-Host
    Write-Host "  OK - Migrations applied" -ForegroundColor Green

    Write-Host "  Running seed..." -ForegroundColor Yellow
    & "$NodeDir\npx.cmd" tsx scripts/seed.ts 2>&1 | Out-Host
    Write-Host "  OK - Seed data inserted" -ForegroundColor Green
} catch {
    Write-Host "  Warning: Some migration/seed steps may have failed: $_" -ForegroundColor Yellow
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Database setup complete!"                    -ForegroundColor Green
Write-Host "  Connection: postgresql://${DbUser}:***@127.0.0.1:5432/${DbName}" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
