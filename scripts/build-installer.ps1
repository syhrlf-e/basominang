$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$innoCandidates = @(@(
  (Get-Command ISCC.exe -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source),
  (Join-Path $env:LOCALAPPDATA 'Programs\Inno Setup 6\ISCC.exe'),
  'C:\Program Files (x86)\Inno Setup 6\ISCC.exe',
  'C:\Program Files\Inno Setup 6\ISCC.exe'
) | Where-Object { $_ -and (Test-Path -LiteralPath $_) })

if ($innoCandidates.Count -eq 0) {
  throw 'Inno Setup 6 tidak ditemukan. Install Inno Setup, lalu jalankan npm run installer kembali.'
}

Push-Location $projectRoot
try {
  npm run build
  & $innoCandidates[0] (Join-Path $projectRoot 'installer\BasoMinang.iss')
} finally {
  Pop-Location
}
