const { app, BrowserWindow, ipcMain, session } = require("electron");
const fs = require("fs");
const path = require("path");
const os = require("os");
const tools = require("./tools.cjs");
const llm = require("./llm.cjs");
const tts = require("./tts.cjs");
const autostart = require("./autostart.cjs");
const speech = require("./speech.cjs");

let mainWindow = null;

function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "localhost";
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1080,
    minHeight: 700,
    backgroundColor: "#060913",
    title: "AURA — Autonomous 3D Anime Desktop Companion",
    frame: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  const dist = path.join(__dirname, "..", "dist", "index.html");
  const wantDev = process.argv.includes("--dev");
  if (wantDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else if (fs.existsSync(dist)) {
    mainWindow.loadFile(dist);
  } else {
    mainWindow.loadURL("http://localhost:5173");
  }

  // Forward Native Speech Events to Renderer
  speech.on("hypothesis", (text) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("speech:hypothesis", text);
    }
  });

  speech.on("recognized", (text) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("speech:recognized", text);
    }
  });

  speech.on("ready", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("speech:ready");
    }
  });

  speech.on("stopped", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("speech:stopped");
    }
  });

  mainWindow.on("closed", () => {
    speech.stop();
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
    callback(permission === "media" || permission === "audioCapture" || permission === "mediaKeySystem");
  });
  session.defaultSession.setPermissionCheckHandler((_wc, permission) => {
    return permission === "media" || permission === "audioCapture" || permission === "mediaKeySystem";
  });

  // Speech Native SAPI IPC
  ipcMain.handle("speech:start", () => speech.start());
  ipcMain.handle("speech:stop", () => speech.stop());
  ipcMain.handle("speech:status", () => speech.getStatus());

  // Tools IPC
  ipcMain.handle("system:stats", () => tools.stats());
  ipcMain.handle("tool:systemReport", () => tools.systemReport());
  ipcMain.handle("tool:openUrl", (_e, url) => tools.openUrl(url));
  ipcMain.handle("tool:launchApp", (_e, appName) => tools.launchApp(appName));
  ipcMain.handle("tool:searchWeb", (_e, payload) => tools.searchWeb(payload || {}));
  ipcMain.handle("tool:controlVolume", (_e, action) => tools.controlVolume(action));
  ipcMain.handle("tool:systemAction", (_e, action) => tools.systemAction(action));
  ipcMain.handle("tool:getBattery", () => tools.getBattery());
  ipcMain.handle("tool:calculate", (_e, expr) => tools.calculateMath(expr));
  ipcMain.handle("tool:getWeather", (_e, city) => tools.getWeather(city));
  ipcMain.handle("tool:playYouTubeSong", (_e, songName) => tools.playYouTubeSong(songName));
  ipcMain.handle("tool:sendMessage", (_e, payload) => tools.sendMessage(payload || {}));
  ipcMain.handle("tool:sendWhatsApp", (_e, payload) => tools.sendWhatsAppMessage(payload || {}));
  ipcMain.handle("tool:autonomousTask", (_e, payload) => tools.executeAutonomousTask(payload || {}));
  ipcMain.handle("tool:getTimeAndDate", () => tools.getTimeAndDate());
  ipcMain.handle("tool:scheduleMeeting", (_e, payload) => tools.scheduleMeeting(payload || {}));

  // LLM & Config
  ipcMain.handle("llm:interpret", (_e, transcript) => llm.interpret(transcript));
  ipcMain.handle("stt:transcribe", (_e, payload) =>
    llm.transcribeGroq(payload.audioBase64, payload.mimeType)
  );
  ipcMain.handle("tts:speak", (_e, text) => tts.speak(text));
  ipcMain.handle("config:keys", () => llm.keyStatus());
  ipcMain.handle("config:saveKeys", (_e, keys) => llm.saveKeys(keys));
  ipcMain.handle("config:localIp", () => ({ ip: getLocalIp() }));
  ipcMain.handle("autostart:get", () => ({ enabled: autostart.isEnabled() }));
  ipcMain.handle("autostart:set", (_e, enabled) => autostart.setEnabled(Boolean(enabled)));
  autostart.sync();

  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  speech.stop();
  if (process.platform !== "darwin") app.quit();
});
