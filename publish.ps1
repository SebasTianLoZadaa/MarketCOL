$ErrorActionPreference = 'Stop'

$ProjectRoot = $PSScriptRoot
$BackendDirectory = Join-Path $ProjectRoot 'backend'
$FrontendDirectory = Join-Path $ProjectRoot 'frontend'
$LogDirectory = Join-Path $ProjectRoot 'logs'
$BackendPort = 3001
$PublicPort = 80
$PublicUrl = 'http://3.218.230.106/'

function Test-PortListening {
    param([int]$Port)
    return $null -ne (Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
}

function Wait-PortListening {
    param([int]$Port, [int]$TimeoutSeconds = 30)
    $deadline = [DateTime]::UtcNow.AddSeconds($TimeoutSeconds)
    while (-not (Test-PortListening $Port) -and [DateTime]::UtcNow -lt $deadline) { }
    return Test-PortListening $Port
}

New-Item -ItemType Directory -Path $LogDirectory -Force | Out-Null

Write-Host 'Compilando frontend React...'
Push-Location $FrontendDirectory
try {
    $env:REACT_APP_API_URL = '/api'
    & npm run build
    if ($LASTEXITCODE -ne 0) { throw 'La compilacion del frontend fallo.' }
}
finally {
    Pop-Location
}

Write-Host 'Configurando firewall de Windows...'
if (-not (Get-NetFirewallRule -DisplayName 'MarketCOL HTTP 80' -ErrorAction SilentlyContinue)) {
    New-NetFirewallRule -DisplayName 'MarketCOL HTTP 80' -Direction Inbound -Action Allow -Protocol TCP -LocalPort $PublicPort -Profile Any | Out-Null
}

if (-not (Get-NetFirewallRule -DisplayName 'MarketCOL bloquear backend 3001' -ErrorAction SilentlyContinue)) {
    New-NetFirewallRule -DisplayName 'MarketCOL bloquear backend 3001' -Direction Inbound -Action Block -Protocol TCP -LocalPort $BackendPort -Profile Any | Out-Null
}

if (-not (Test-PortListening $BackendPort)) {
    Write-Host 'Iniciando backend en el puerto 3001...'
    Start-Process -FilePath 'npm.cmd' -ArgumentList 'start' -WorkingDirectory $BackendDirectory `
        -RedirectStandardOutput (Join-Path $LogDirectory 'backend.log') `
        -RedirectStandardError (Join-Path $LogDirectory 'backend-error.log')
    if (-not (Wait-PortListening $BackendPort)) { throw 'El backend no inicio en 30 segundos. Revise logs/backend-error.log.' }
}

if (Test-PortListening $PublicPort) {
    Write-Host 'El puerto 80 ya esta ocupado. No se iniciara otro gateway.' -ForegroundColor Yellow
}
else {
    Write-Host 'Iniciando gateway publico en el puerto 80...'
    Start-Process -FilePath 'node.exe' -ArgumentList 'publish-server.js' -WorkingDirectory $ProjectRoot `
        -RedirectStandardOutput (Join-Path $LogDirectory 'gateway.log') `
        -RedirectStandardError (Join-Path $LogDirectory 'gateway-error.log')
    if (-not (Wait-PortListening $PublicPort)) { throw 'El gateway no inicio en 30 segundos. Revise logs/gateway-error.log.' }
}

if (-not (Test-PortListening $BackendPort)) { throw 'El backend no esta escuchando en el puerto 3001. Revise logs/backend-error.log.' }
if (-not (Test-PortListening $PublicPort)) { throw 'El gateway no esta escuchando en el puerto 80. Revise logs/gateway-error.log.' }

$frontendResponse = Invoke-WebRequest -Uri 'http://127.0.0.1/' -UseBasicParsing
$apiResponse = Invoke-WebRequest -Uri 'http://127.0.0.1/api/health' -UseBasicParsing

if ($frontendResponse.StatusCode -ne 200 -or $apiResponse.StatusCode -ne 200) {
    throw 'La validacion HTTP no devolvio 200 para frontend y API.'
}

Write-Host "Publicacion lista: $PublicUrl" -ForegroundColor Green
Write-Host "Frontend: HTTP $($frontendResponse.StatusCode)"
Write-Host "API: HTTP $($apiResponse.StatusCode)"