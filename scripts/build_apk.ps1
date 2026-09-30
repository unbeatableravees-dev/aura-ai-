$ErrorActionPreference = "Stop"

$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "C:\Users\DELL\AppData\Local\Android\Sdk"
$env:PATH = "$env:JAVA_HOME\bin;" + $env:PATH

Write-Output "JAVA_HOME: $env:JAVA_HOME"
Write-Output "ANDROID_HOME: $env:ANDROID_HOME"

Set-Location "$PSScriptRoot\..\android"
& ".\gradle-8.14.3\bin\gradle.bat" assembleDebug --no-daemon

if ($LASTEXITCODE -eq 0) {
    Write-Output "BUILD SUCCESSFUL!"
} else {
    Write-Output "BUILD FAILED with code $LASTEXITCODE"
}
