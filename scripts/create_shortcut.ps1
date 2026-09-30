$desktop = [Environment]::GetFolderPath("Desktop")
$lnkPath = Join-Path $desktop "RAF.lnk"
$wsh = New-Object -ComObject WScript.Shell
$sc = $wsh.CreateShortcut($lnkPath)
$sc.TargetPath = "C:\Users\DELL\iris\release-exe\RAF-win32-x64\RAF.exe"
$sc.WorkingDirectory = "C:\Users\DELL\iris\release-exe\RAF-win32-x64"
$sc.Description = "RAF - Reactive Autonomous Force"
$sc.Save()
Write-Output "SUCCESS: $lnkPath"
