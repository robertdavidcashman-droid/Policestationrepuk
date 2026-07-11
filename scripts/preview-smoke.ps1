# Preview (or any) deployment smoke — run critical paths N times (default 10).
param(
  [Parameter(Mandatory = $true)][string]$BaseUrl,
  [int]$Runs = 10
)

$BaseUrl = $BaseUrl.TrimEnd('/')
$failures = 0

function Check-Path {
  param([string]$Path, [string]$Expected)
  try {
    $resp = Invoke-WebRequest -Uri "$BaseUrl$Path" -UseBasicParsing -TimeoutSec 30
    $code = [int]$resp.StatusCode
  } catch {
    if ($_.Exception.Response) {
      $code = [int]$_.Exception.Response.StatusCode
    } else {
      $code = 0
    }
  }
  if ("$code" -ne $Expected) {
    Write-Host "FAIL $Path -> HTTP $code (expected $Expected)"
    return $false
  }
  Write-Host "OK   $Path -> HTTP $code"
  return $true
}

for ($run = 1; $run -le $Runs; $run++) {
  Write-Host ""
  Write-Host "=== smoke run $run/$Runs ==="
  if (-not (Check-Path '/api/health' '200')) { $failures++ }
  if (-not (Check-Path '/api/ready' '200')) { $failures++ }
  if (-not (Check-Path '/' '200')) { $failures++ }
  if (-not (Check-Path '/directory' '200')) { $failures++ }
  if (-not (Check-Path '/Register' '200')) { $failures++ }
  try {
    $resp = Invoke-WebRequest -Uri "$BaseUrl/api/cron/firm-outreach-bootstrap" -UseBasicParsing -TimeoutSec 30
    $cronCode = [int]$resp.StatusCode
  } catch {
    $cronCode = [int]$_.Exception.Response.StatusCode
  }
  if ("$cronCode" -ne '401') {
    Write-Host "FAIL /api/cron/firm-outreach-bootstrap -> HTTP $cronCode (expected 401)"
    $failures++
  } else {
    Write-Host "OK   /api/cron/firm-outreach-bootstrap -> HTTP $cronCode"
  }
}

Write-Host ""
if ($failures -gt 0) {
  Write-Host "preview-smoke: FAILED ($failures check(s) across $Runs run(s))"
  exit 1
}
Write-Host "preview-smoke: ALL PASSED ($Runs run(s))"
