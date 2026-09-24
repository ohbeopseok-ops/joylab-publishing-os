param(
  [string]$Downloads = "$HOME\Downloads",
  [string]$StartDate = "",
  [string]$EndDate = "",
  [switch]$Commit,
  [switch]$Push
)

$ErrorActionPreference = "Stop"
$Repo = Split-Path -Parent $PSScriptRoot
$Inbox = Join-Path $Repo "data\gsc\inbox"
New-Item -ItemType Directory -Force -Path $Inbox | Out-Null

function Test-GscPagesCsv([string]$Path) {
  try {
    $first = Get-Content -LiteralPath $Path -TotalCount 1 -Encoding UTF8
    $h = $first.ToLowerInvariant()
    $hasPage = $h.Contains("page") -or $h.Contains("페이지")
    $hasClicks = $h.Contains("click") -or $h.Contains("클릭")
    $hasImpressions = $h.Contains("impression") -or $h.Contains("노출")
    return $hasPage -and $hasClicks -and $hasImpressions
  } catch { return $false }
}

$candidates = Get-ChildItem -LiteralPath $Downloads -Filter *.csv -File |
  Sort-Object LastWriteTime -Descending |
  Where-Object { Test-GscPagesCsv $_.FullName }

if (-not $candidates) {
  throw "Downloads 폴더에서 GSC Pages CSV를 찾지 못했습니다."
}

$source = $candidates[0]
$target = Join-Path $Inbox "pages.csv"
Copy-Item -LiteralPath $source.FullName -Destination $target -Force
Write-Host "GSC CSV: $($source.FullName)"
Write-Host "Inbox : $target"

if ($StartDate -and $EndDate) {
  $meta = @{
    startDate = $StartDate
    endDate = $EndDate
  } | ConvertTo-Json
  Set-Content -LiteralPath (Join-Path $Inbox "import.json") -Value $meta -Encoding UTF8
} elseif (Test-Path (Join-Path $Inbox "import.json")) {
  Remove-Item (Join-Path $Inbox "import.json") -Force
}

Push-Location $Repo
try {
  node scripts/gsc-manual-import.mjs --input data/gsc/inbox
  node scripts/research-corpus-evidence-audit.mjs

  if ($Commit) {
    git add data/gsc/inbox/pages.csv data/gsc/inbox/import.json 2>$null
    git add data/gsc/latest.json data/gsc/history
    git commit -m "gsc: stage manual Search Console import"
  }

  if ($Push) {
    if (-not $Commit) { throw "-Push는 -Commit과 함께 사용하세요." }
    git push
  }
} finally {
  Pop-Location
}

Write-Host ""
Write-Host "완료: CSV 탐지 → Normalize → Traffic Score → Evidence Priority 재계산"
if (-not $Commit) {
  Write-Host "GitHub 자동 ingest까지 보내려면: .\scripts\gsc-import-latest.ps1 -Commit -Push"
}
