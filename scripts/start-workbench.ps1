$ErrorActionPreference = 'Stop'

$workbenchRoot = Split-Path -Parent $PSScriptRoot
$adminUrl = 'http://127.0.0.1:4173/admin/'
$statusUrl = 'http://127.0.0.1:4173/api/local-content/status'
$outputLog = Join-Path $workbenchRoot 'preview-output.log'
$errorLog = Join-Path $workbenchRoot 'preview-error.log'

function Test-WorkbenchReady {
  try {
    $result = Invoke-RestMethod -Uri $statusUrl -TimeoutSec 2
    return $result.available -eq $true
  } catch {
    return $false
  }
}

if (-not (Test-WorkbenchReady)) {
  Start-Process `
    -FilePath $env:ComSpec `
    -ArgumentList @('/d', '/c', 'npm.cmd run docs:dev') `
    -WorkingDirectory $workbenchRoot `
    -WindowStyle Hidden `
    -RedirectStandardOutput $outputLog `
    -RedirectStandardError $errorLog

  $ready = $false
  for ($attempt = 0; $attempt -lt 40; $attempt++) {
    Start-Sleep -Milliseconds 500
    if (Test-WorkbenchReady) {
      $ready = $true
      break
    }
  }

  if (-not $ready) {
    $message = 'The workbench could not start. Please check preview-error.log in the project folder.'
    (New-Object -ComObject WScript.Shell).Popup($message, 0, 'HellyAI Workbench', 16) | Out-Null
    exit 1
  }
}

Start-Process $adminUrl
