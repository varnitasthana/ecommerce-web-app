$ErrorActionPreference = 'SilentlyContinue'
$projectPath = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path.Replace('/', '\')

$processes = Get-CimInstance Win32_Process | Where-Object {
  $_.CommandLine -like "*$projectPath*" -and $_.Name -match 'node|npm|cmd|concurrently'
}

foreach ($process in $processes) {
  Stop-Process -Id $process.ProcessId -Force
}

Write-Host "Cleaned ecommerce development processes."
& npm run dev