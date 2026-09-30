Set sh = CreateObject("WScript.Shell")
sh.CurrentDirectory = "C:\\Users\\DELL\\iris"
sh.Run """C:\\Users\\DELL\\iris\\node_modules\\electron\\dist\\electron.exe"" ""C:\\Users\\DELL\\iris""", 0, False
