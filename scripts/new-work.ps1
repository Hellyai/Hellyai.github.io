param(
  [Parameter(Mandatory=$true)][string]$Slug,
  [Parameter(Mandatory=$true)][string]$Title
)

$projectRoot = Split-Path -Parent $PSScriptRoot
$template = Join-Path $projectRoot 'templates\work-template.md'
$target = Join-Path $projectRoot "docs\work\$Slug.md"

if (Test-Path -LiteralPath $target) {
  Write-Error "文件已经存在：$target"
  exit 1
}

$content = Get-Content -Raw -Encoding UTF8 -LiteralPath $template
$content = $content.Replace('请填写项目名称', $Title)
Set-Content -Encoding UTF8 -LiteralPath $target -Value $content
Write-Host "已创建：$target"
Write-Host '打开文件填写内容，然后运行 npm.cmd run docs:dev 预览。'
