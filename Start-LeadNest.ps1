$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
if (-not (Test-Path -LiteralPath '.env')) { Copy-Item -LiteralPath '.env.example' -Destination '.env'; throw 'Configure the new .env file locally, then run this script again. See README.md.' }
$values = @{}
Get-Content -LiteralPath '.env' | ForEach-Object { if ($_ -match '^([A-Z_]+)=(.*)$') { $values[$matches[1]] = $matches[2] } }
$port = if ($values.DB_PORT) { [int]$values.DB_PORT } else { 3306 }
$client = [Net.Sockets.TcpClient]::new()
$connected = $false
try { $connected = $client.ConnectAsync('127.0.0.1',$port).Wait(1000) -and $client.Connected } catch {} finally { $client.Dispose() }
if (-not $connected -and (Test-Path -LiteralPath '.local-db.json')) {
  $local = Get-Content -LiteralPath '.local-db.json' -Raw | ConvertFrom-Json
  $configuredDataPath = [string]$local.dataDirectory
  if ([string]::IsNullOrWhiteSpace($configuredDataPath)) { throw 'The local database directory is missing from .local-db.json.' }
  if ([IO.Path]::IsPathRooted($configuredDataPath)) {
    $dataPath = [IO.Path]::GetFullPath($configuredDataPath)
  } else {
    $dataPath = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot $configuredDataPath))
  }
  if (-not (Test-Path -LiteralPath (Join-Path $dataPath 'auto.cnf'))) { throw 'The initialized development database was not found. See README.md to configure MySQL.' }
  New-Item -ItemType Directory -Force -Path 'work' | Out-Null
  $logPath = Join-Path $PSScriptRoot 'work/mysql-error.log'
  Start-Process -FilePath $local.mysqlServer -ArgumentList '--no-defaults',("--datadir=" + [char]34 + $dataPath + [char]34),("--port=" + $port),'--bind-address=127.0.0.1','--mysqlx=OFF',("--log-error=" + [char]34 + $logPath + [char]34) -WindowStyle Hidden
  Start-Sleep -Seconds 3
}
if (-not (Test-Path -LiteralPath 'node_modules')) { & npm.cmd ci; if ($LASTEXITCODE -ne 0) { throw 'Package installation failed' } }
& npm.cmd run migrate
if ($LASTEXITCODE -ne 0) { throw 'Database migration failed. Check .env and MySQL.' }
& npm.cmd run build
if ($LASTEXITCODE -ne 0) { throw 'Frontend build failed' }
Write-Host 'Open http://127.0.0.1:3000. Press Ctrl+C here to stop the app.'
& npm.cmd start

