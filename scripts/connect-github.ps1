param(
  [string]$RepositoryUrl = 'https://github.com/Hellyai/Hellyai.github.io.git'
)

$ErrorActionPreference = 'Stop'
$workbenchRoot = Split-Path -Parent $PSScriptRoot
Set-Location $workbenchRoot
$env:GCM_PROVIDER = 'github'
$env:GCM_GITHUB_AUTHMODES = 'device'

function Invoke-Git {
  param([Parameter(Mandatory = $true)][string[]]$GitArguments)
  & git -C $workbenchRoot @GitArguments
  if ($LASTEXITCODE -ne 0) { throw "Git command failed: git $($GitArguments -join ' ')" }
}

& git -C $workbenchRoot rev-parse --is-inside-work-tree *> $null
if ($LASTEXITCODE -ne 0) {
  Invoke-Git -GitArguments @('init', '-b', 'main')
}

if (-not (& git -C $workbenchRoot config --local user.name)) {
  Invoke-Git -GitArguments @('config', '--local', 'user.name', 'Hellyai')
}
if (-not (& git -C $workbenchRoot config --local user.email)) {
  Invoke-Git -GitArguments @('config', '--local', 'user.email', 'Hellyai@users.noreply.github.com')
}
Invoke-Git -GitArguments @('config', '--local', 'http.version', 'HTTP/1.1')

Invoke-Git -GitArguments @('add', '-A')
& git -C $workbenchRoot diff --cached --quiet
if ($LASTEXITCODE -eq 1) {
  Invoke-Git -GitArguments @('commit', '-m', 'Initialize HellyAI workbench')
} elseif ($LASTEXITCODE -ne 0) {
  throw 'Unable to inspect staged changes.'
}

$remotes = @(& git -C $workbenchRoot remote)
if ($remotes -contains 'origin') {
  $existingOrigin = (& git -C $workbenchRoot remote get-url origin)
  if ($existingOrigin.Trim() -ne $RepositoryUrl) {
    throw "The current origin points to $existingOrigin. Confirm it before changing the remote repository."
  }
} else {
  Invoke-Git -GitArguments @('remote', 'add', 'origin', $RepositoryUrl)
}

Invoke-Git -GitArguments @('branch', '-M', 'main')
& git credential-manager github login --username Hellyai --device
if ($LASTEXITCODE -ne 0) { throw 'GitHub device authentication failed or expired.' }
Invoke-Git -GitArguments @('push', '-u', 'origin', 'main')
Write-Host 'GitHub is connected. Future saves from the local admin page will be committed and pushed automatically.'
