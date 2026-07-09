param(
    [string]$AndroidVersionFile = (Join-Path $PSScriptRoot "..\android\version.properties"),
    [string]$VersionJsonFile = (Join-Path $PSScriptRoot "..\public\version.json"),
    [string]$AndroidVersionJsonFile = (Join-Path $PSScriptRoot "..\android\app\src\main\assets\public\version.json")
)

$ErrorActionPreference = "Stop"

function Read-VersionFile {
    param([string]$Path)

    $values = @{}
    if (Test-Path -LiteralPath $Path) {
        Get-Content -LiteralPath $Path | ForEach-Object {
            if ($_ -match '^\s*([^#=]+?)\s*=\s*(.*?)\s*$') {
                $values[$matches[1].Trim()] = $matches[2].Trim()
            }
        }
    }

    return $values
}

function Write-VersionProperties {
    param(
        [string]$Path,
        [int]$VersionCode,
        [string]$VersionName
    )

    @"
VERSION_CODE=$VersionCode
VERSION_NAME=$VersionName
"@ | Set-Content -LiteralPath $Path -Encoding ascii
}

$current = Read-VersionFile -Path $AndroidVersionFile
$versionCode = 1
$versionName = "1.0.0"

if ($current.ContainsKey("VERSION_CODE")) {
    $versionCode = [int]$current["VERSION_CODE"]
}

if ($current.ContainsKey("VERSION_NAME") -and -not [string]::IsNullOrWhiteSpace($current["VERSION_NAME"])) {
    $versionName = $current["VERSION_NAME"]
}

$segments = $versionName.Split(".")
$majorParsed = 0
$minorParsed = 0
$patchParsed = 0
if ($segments.Length -ge 3 -and
    [int]::TryParse($segments[0], [ref]$majorParsed) -and
    [int]::TryParse($segments[1], [ref]$minorParsed) -and
    [int]::TryParse($segments[2], [ref]$patchParsed)) {
    $major = [int]$segments[0]
    $minor = [int]$segments[1]
    $patch = [int]$segments[2] + 1
    $newVersionName = "$major.$minor.$patch"
} else {
    $newVersionName = "1.0.1"
}

$newVersionCode = $versionCode + 1
$builtAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

Write-VersionProperties -Path $AndroidVersionFile -VersionCode $newVersionCode -VersionName $newVersionName

@{
    versionCode = $newVersionCode
    versionName = $newVersionName
    builtAt = $builtAt
} | ConvertTo-Json | Set-Content -LiteralPath $VersionJsonFile -Encoding ascii

$androidVersionJsonDir = Split-Path -Parent $AndroidVersionJsonFile
if (-not (Test-Path -LiteralPath $androidVersionJsonDir)) {
    New-Item -ItemType Directory -Path $androidVersionJsonDir -Force | Out-Null
}
Copy-Item -LiteralPath $VersionJsonFile -Destination $AndroidVersionJsonFile -Force

Write-Host "Bumped APK version to $newVersionName ($newVersionCode)"
