$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$settings = @{}
Get-Content -LiteralPath '.env' | ForEach-Object { if ($_ -match '^([A-Z_]+)=(.*)$') { $settings[$matches[1]] = $matches[2] } }
$listenPort = if ($settings.PORT) { [int]$settings.PORT } else { 3000 }
$listeners = @(Get-NetTCPConnection -State Listen -ErrorAction Stop | Where-Object { $_.LocalPort -eq $listenPort })
foreach ($processId in @($listeners.OwningProcess | Sort-Object -Unique)) {
 $runningServer = Get-CimInstance Win32_Process -Filter ('ProcessId=' + $processId)
 if ($runningServer.Name -ne 'node.exe' -or $runningServer.CommandLine -notmatch 'server[/\\]index\.js') { throw ('Port ' + $listenPort + ' belongs to another application. Stop that application yourself before starting LeadNest.') }
 Write-Host ('Stopping the previous LeadNest server on port ' + $listenPort)
 Stop-Process -Id $processId -ErrorAction Stop
}
& (Join-Path $PSScriptRoot 'Start-LeadNest.ps1')
