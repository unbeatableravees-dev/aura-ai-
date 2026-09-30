const { contextBridge, ipcRenderer } = require("electron");

const api = {
  // Speech Native SAPI
  startNativeSpeech: () => ipcRenderer.invoke("speech:start"),
  stopNativeSpeech: () => ipcRenderer.invoke("speech:stop"),
  getNativeSpeechStatus: () => ipcRenderer.invoke("speech:status"),
  onSpeechHypothesis: (cb) => {
    const handler = (_event, val) => cb(val);
    ipcRenderer.on("speech:hypothesis", handler);
    return () => ipcRenderer.removeListener("speech:hypothesis", handler);
  },
  onSpeechRecognized: (cb) => {
    const handler = (_event, val) => cb(val);
    ipcRenderer.on("speech:recognized", handler);
    return () => ipcRenderer.removeListener("speech:recognized", handler);
  },
  onSpeechReady: (cb) => {
    const handler = () => cb();
    ipcRenderer.on("speech:ready", handler);
    return () => ipcRenderer.removeListener("speech:ready", handler);
  },
  onSpeechStopped: (cb) => {
    const handler = () => cb();
    ipcRenderer.on("speech:stopped", handler);
    return () => ipcRenderer.removeListener("speech:stopped", handler);
  },

  // Tools
  getStats: () => ipcRenderer.invoke("system:stats"),
  getReport: () => ipcRenderer.invoke("tool:systemReport"),
  openUrl: (url) => ipcRenderer.invoke("tool:openUrl", url),
  launchApp: (appName) => ipcRenderer.invoke("tool:launchApp", appName),
  searchWeb: (payload) => ipcRenderer.invoke("tool:searchWeb", payload),
  controlVolume: (action) => ipcRenderer.invoke("tool:controlVolume", action),
  systemAction: (action) => ipcRenderer.invoke("tool:systemAction", action),
  getBattery: () => ipcRenderer.invoke("tool:getBattery"),
  calculate: (expr) => ipcRenderer.invoke("tool:calculate", expr),
  getWeather: (city) => ipcRenderer.invoke("tool:getWeather", city),
  playYouTubeSong: (songName) => ipcRenderer.invoke("tool:playYouTubeSong", songName),
  sendMessage: (payload) => ipcRenderer.invoke("tool:sendMessage", payload),
  sendWhatsApp: (payload) => ipcRenderer.invoke("tool:sendWhatsApp", payload),
  runAutonomousTask: (payload) => ipcRenderer.invoke("tool:autonomousTask", payload),
  scheduleMeeting: (payload) => ipcRenderer.invoke("tool:scheduleMeeting", payload),

  // Brain & Config
  interpret: (transcript) => ipcRenderer.invoke("llm:interpret", transcript),
  transcribe: (audioBase64, mimeType) =>
    ipcRenderer.invoke("stt:transcribe", { audioBase64, mimeType }),
  speak: (text) => ipcRenderer.invoke("tts:speak", text),
  hasKeys: () => ipcRenderer.invoke("config:keys"),
  saveKeys: (keys) => ipcRenderer.invoke("config:saveKeys", keys),
  getLocalIp: () => ipcRenderer.invoke("config:localIp"),
  getAutostart: () => ipcRenderer.invoke("autostart:get"),
  setAutostart: (enabled) => ipcRenderer.invoke("autostart:set", enabled),
};

contextBridge.exposeInMainWorld("iris", api);
contextBridge.exposeInMainWorld("raf", api);
contextBridge.exposeInMainWorld("aura", api);
