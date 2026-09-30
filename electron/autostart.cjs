const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { app } = require("electron");

const ROOT = path.join(__dirname, "..");
const FLAG = path.join(ROOT, ".raf-autostart");
const VBS = path.join(ROOT, "scripts", "start-raf.vbs");

function electronExe() {
  const local = path.join(ROOT, "node_modules", "electron", "dist", "electron.exe");
  if (fs.existsSync(local)) return local;
  return process.execPath;
}

function loginArgs() {
  if (app.isPackaged) return [];
  return [ROOT];
}

function writeLauncher() {
  fs.mkdirSync(path.dirname(VBS), { recursive: true });
  const exe = electronExe().replace(/\\/g, "\\\\");
  const root = ROOT.replace(/\\/g, "\\\\");
  fs.writeFileSync(
    VBS,
    [
      'Set sh = CreateObject("WScript.Shell")',
      `sh.CurrentDirectory = "${root}"`,
      `sh.Run """${exe}"" ""${root}""", 0, False`,
      "",
    ].join("\r\n"),
    "utf8"
  );
}

function startupShortcutPath() {
  const startup = path.join(
    process.env.APPDATA || "",
    "Microsoft",
    "Windows",
    "Start Menu",
    "Programs",
    "Startup"
  );
  return path.join(startup, "RAF.lnk");
}

function writeShortcut(enabled) {
  const lnk = startupShortcutPath();
  if (!enabled) {
    if (fs.existsSync(lnk)) fs.unlinkSync(lnk);
    return;
  }
  writeLauncher();
  const ps = `
$wsh = New-Object -ComObject WScript.Shell
$sc = $wsh.CreateShortcut(${JSON.stringify(lnk)})
$sc.TargetPath = "wscript.exe"
$sc.Arguments = ${JSON.stringify(`"${VBS}"`)}
$sc.WorkingDirectory = ${JSON.stringify(ROOT)}
$sc.WindowStyle = 7
$sc.Description = "Start RAF at logon"
$sc.Save()
`;
  execFileSync("powershell.exe", ["-NoProfile", "-Command", ps], { windowsHide: true });
}

function applyLoginItem(enabled) {
  app.setLoginItemSettings({
    openAtLogin: enabled,
    path: electronExe(),
    args: loginArgs(),
  });
}

function isEnabled() {
  if (fs.existsSync(FLAG)) return fs.readFileSync(FLAG, "utf8").trim() !== "0";
  return true;
}

function setEnabled(enabled) {
  fs.writeFileSync(FLAG, enabled ? "1" : "0", "utf8");
  applyLoginItem(enabled);
  try {
    writeShortcut(enabled);
  } catch {
    /* shortcut is a fallback; login item still applies */
  }
  return { enabled, shortcut: startupShortcutPath() };
}

function sync() {
  return setEnabled(isEnabled());
}

module.exports = { isEnabled, setEnabled, sync };
