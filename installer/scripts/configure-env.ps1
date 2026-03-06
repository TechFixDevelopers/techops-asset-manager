# ============================================================
# TechOps Asset Manager - Environment Configuration
# Generates .env.local with the correct settings
# ============================================================

param(
    [string]$InstallDir = "C:\TechOps",
    [string]$DbPassword = "techops_secure_2025",
    [string]$DbName = "techops_assets",
    [string]$DbUser = "techops",
    [int]$Port = 3000
)

$AppDir = Join-Path $InstallDir "app"
$EnvFile = Join-Path $AppDir ".env.local"

# Generate a random AUTH_SECRET
$bytes = New-Object byte[] 32
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
$authSecret = [BitConverter]::ToString($bytes).Replace("-", "").ToLower()

# Detect local IP for AUTH_URL
$localIP = (Get-NetIPAddress -AddressFamily IPv4 | 
    Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.PrefixOrigin -ne "WellKnown" } | 
    Select-Object -First 1).IPAddress

if (-not $localIP) { $localIP = "localhost" }

$envContent = @"
# TechOps Asset Manager - Environment Configuration
# Generated automatically during installation

# PostgreSQL connection
DATABASE_URL=postgresql://${DbUser}:${DbPassword}@127.0.0.1:5432/${DbName}

# Auth.js secret (auto-generated)
AUTH_SECRET=${authSecret}

# Base URL (use the server's IP for network access)
AUTH_URL=http://${localIP}:${Port}

# Application port
PORT=${Port}
HOSTNAME=0.0.0.0

# Optional: ServiceNow integration
# SERVICENOW_INSTANCE_URL=https://your-instance.service-now.com
# SERVICENOW_USERNAME=
# SERVICENOW_PASSWORD=
"@

Set-Content -Path $EnvFile -Value $envContent -Encoding UTF8
Write-Host "Environment configured at: $EnvFile" -ForegroundColor Green
Write-Host "  AUTH_URL = http://${localIP}:${Port}" -ForegroundColor Cyan
Write-Host "  DATABASE_URL = postgresql://${DbUser}:***@127.0.0.1:5432/${DbName}" -ForegroundColor Cyan
