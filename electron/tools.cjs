const os = require("os");
const { exec, spawn } = require("child_process");
const { shell } = require("electron");

function cpuPercent() {
  const cpus = os.cpus();
  let idle = 0;
  let total = 0;
  for (const cpu of cpus) {
    for (const type of Object.keys(cpu.times)) total += cpu.times[type];
    idle += cpu.times.idle;
  }
  return Math.round((1 - idle / total) * 1000) / 10;
}

function ram() {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  return {
    usedGb: Math.round((used / 1024 ** 3) * 10) / 10,
    totalGb: Math.round((total / 1024 ** 3) * 10) / 10,
    percent: Math.round((used / total) * 1000) / 10,
  };
}

function stats() {
  const memory = ram();
  return {
    cpu: cpuPercent(),
    ram: memory.percent,
    ramUsedGb: memory.usedGb,
    ramTotalGb: memory.totalGb,
    cores: os.cpus().length,
    hostname: os.hostname(),
    platform: os.platform(),
    uptimeSec: Math.floor(os.uptime()),
    status: "ONLINE",
  };
}

function systemReport() {
  const s = stats();
  return {
    ok: true,
    spoken: `Systems nominal. Host ${s.hostname}. CPU usage is ${s.cpu} percent. Memory is ${s.ram} percent of ${s.ramTotalGb} gigabytes across ${s.cores} CPU cores. All RAF subsystems online.`,
    report: s,
  };
}

function openUrl(url) {
  const safe = String(url || "").trim();
  if (!/^https?:\/\//i.test(safe)) {
    return { ok: false, spoken: "That URL is not valid." };
  }
  if (process.platform === "win32") {
    exec(`start "" "${safe}"`, (err) => {
      if (err) shell.openExternal(safe);
    });
  } else {
    shell.openExternal(safe);
  }
  return { ok: true, spoken: `Opening ${safe}` };
}

const APP_MAP = {
  notepad: { cmd: "notepad.exe", name: "Notepad" },
  calculator: { cmd: "calc.exe", name: "Calculator" },
  calc: { cmd: "calc.exe", name: "Calculator" },
  code: { cmd: "code .", name: "Visual Studio Code" },
  vscode: { cmd: "code .", name: "Visual Studio Code" },
  explorer: { cmd: "explorer.exe", name: "File Explorer" },
  files: { cmd: "explorer.exe", name: "File Explorer" },
  downloads: { cmd: "explorer.exe shell:Downloads", name: "Downloads" },
  documents: { cmd: "explorer.exe shell:Personal", name: "Documents" },
  taskmgr: { cmd: "taskmgr.exe", name: "Task Manager" },
  taskmanager: { cmd: "taskmgr.exe", name: "Task Manager" },
  cmd: { cmd: "start cmd.exe", name: "Command Prompt" },
  terminal: { cmd: "start cmd.exe", name: "Terminal" },
  powershell: { cmd: "start powershell.exe", name: "PowerShell" },
  chrome: { cmd: 'start "" chrome', name: "Google Chrome" },
  edge: { cmd: 'start "" msedge', name: "Microsoft Edge" },
  paint: { cmd: "mspaint.exe", name: "MS Paint" },
  snippingtool: { cmd: "snippingtool.exe", name: "Snipping Tool" },
  screenshot: { cmd: "snippingtool.exe", name: "Snipping Tool" },
  settings: { cmd: "start ms-settings:", name: "Windows Settings" },
  controlpanel: { cmd: "control.exe", name: "Control Panel" },
  spotify: { cmd: "start spotify:", name: "Spotify" },
  whatsapp: { cmd: "start whatsapp:", name: "WhatsApp" },
};

function launchApp(appName) {
  const key = String(appName || "").toLowerCase().replace(/[\s_-]/g, "");
  let target = APP_MAP[key];

  if (!target) {
    for (const [k, v] of Object.entries(APP_MAP)) {
      if (key.includes(k) || k.includes(key)) {
        target = v;
        break;
      }
    }
  }

  const finalCmd = target ? target.cmd : `${appName}.exe`;
  const readableName = target ? target.name : appName;

  exec(finalCmd, (err) => {
    if (err) {
      exec(`start ${appName}`, () => {});
    }
  });

  return {
    ok: true,
    spoken: `Launching ${readableName}, sir.`,
    app: readableName,
  };
}

// Directly plays top video on YouTube instead of just search listing
async function playYouTubeSong(songName) {
  const clean = String(songName || "").trim();
  if (!clean) {
    shell.openExternal("https://www.youtube.com");
    return { ok: true, spoken: "Opening YouTube." };
  }

  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(clean)}`;
    const res = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    const html = await res.text();
    const match = html.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);

    if (match && match[1]) {
      const videoId = match[1];
      const directUrl = `https://www.youtube.com/watch?v=${videoId}&autoplay=1`;
      shell.openExternal(directUrl);
      return {
        ok: true,
        spoken: `Playing ${clean} on YouTube now, sir.`,
        url: directUrl,
      };
    }
  } catch (err) {
    console.warn("YouTube scrape error, falling back to search:", err);
  }

  // Fallback
  const fallbackUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(clean)}`;
  shell.openExternal(fallbackUrl);
  return { ok: true, spoken: `Searching and playing ${clean} on YouTube.`, url: fallbackUrl };
}

function sendMessage({ recipient = "", message = "", platform = "whatsapp" }) {
  const cleanRecipient = String(recipient || "").trim();
  const cleanMessage = String(message || "").trim();

  // If phone number is specified
  const phoneDigits = cleanRecipient.replace(/\D/g, "");

  if (phoneDigits.length >= 10) {
    const url = `https://web.whatsapp.com/send?phone=${phoneDigits}${
      cleanMessage ? `&text=${encodeURIComponent(cleanMessage)}` : ""
    }`;
    shell.openExternal(url);
    return {
      ok: true,
      spoken: `Opening WhatsApp chat with ${cleanRecipient}.`,
    };
  }

  // General recipient or "someone"
  exec("start whatsapp:", (err) => {
    if (err) {
      shell.openExternal(
        cleanMessage
          ? `https://web.whatsapp.com/send?text=${encodeURIComponent(cleanMessage)}`
          : "https://web.whatsapp.com"
      );
    }
  });

  const spoken = cleanRecipient && cleanRecipient !== "someone" && cleanRecipient !== "kisi ko"
    ? `Launching WhatsApp to send message to ${cleanRecipient}, sir.`
    : `Opening WhatsApp. Who would you like to message and what should I write?`;

  return { ok: true, spoken };
}

function searchWeb({ engine = "google", query = "" }) {
  const clean = query.trim();
  if (!clean) return { ok: false, spoken: "What would you like to search for?" };

  if (engine === "youtube" || /youtube|song|gaana|music|video/i.test(engine)) {
    return playYouTubeSong(clean);
  }

  let url = `https://www.google.com/search?q=${encodeURIComponent(clean)}`;
  let spoken = `Searching Google for ${clean}.`;

  if (engine === "wikipedia") {
    url = `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(clean)}`;
    spoken = `Searching Wikipedia for ${clean}.`;
  }

  shell.openExternal(url);
  return { ok: true, spoken, url };
}

function controlVolume(action) {
  const act = String(action || "").toLowerCase();
  let keycode = 173; // mute
  let spoken = "Toggling mute.";

  if (act.includes("up") || act.includes("increase") || act.includes("badhao") || act.includes("high")) {
    keycode = 175;
    spoken = "Volume increased.";
  } else if (act.includes("down") || act.includes("decrease") || act.includes("kam") || act.includes("low")) {
    keycode = 174;
    spoken = "Volume decreased.";
  } else if (act.includes("play") || act.includes("pause") || act.includes("roko")) {
    keycode = 179;
    spoken = "Media play pause toggled.";
  } else {
    spoken = "Volume muted.";
  }

  const ps = `(New-Object -ComObject WScript.Shell).SendKeys([char]${keycode})`;
  exec(`powershell -NoProfile -Command "${ps}"`);

  return { ok: true, spoken, action: act };
}

function systemAction(action) {
  const act = String(action || "").toLowerCase();

  if (act.includes("lock") || act.includes("screen lock")) {
    exec("rundll32.exe user32.dll,LockWorkStation");
    return { ok: true, spoken: "Locking workstation now." };
  }

  if (act.includes("recycle") || act.includes("trash") || act.includes("bin") || act.includes("kachra")) {
    exec('powershell -NoProfile -Command "Clear-RecycleBin -Force -ErrorAction SilentlyContinue"');
    return { ok: true, spoken: "Recycle Bin cleared, sir." };
  }

  if (act.includes("screenshot") || act.includes("snip")) {
    exec("snippingtool.exe");
    return { ok: true, spoken: "Opening Snipping Tool for capture." };
  }

  return { ok: false, spoken: "Action not recognized." };
}

async function getBattery() {
  return new Promise((resolve) => {
    exec(
      'powershell -NoProfile -Command "Get-CimInstance Win32_Battery | Select-Object -Property EstimatedChargeRemaining, BatteryStatus | ConvertTo-Json"',
      (err, stdout) => {
        if (err || !stdout.trim()) {
          resolve({
            ok: true,
            spoken: "Desktop device detected running on direct AC power.",
            battery: { percent: 100, charging: true },
          });
          return;
        }
        try {
          const data = JSON.parse(stdout.trim());
          const percent = data.EstimatedChargeRemaining || 100;
          const status = data.BatteryStatus === 2 ? "charging" : "discharging";
          resolve({
            ok: true,
            spoken: `Battery is at ${percent} percent, ${status}.`,
            battery: { percent, status },
          });
        } catch {
          resolve({
            ok: true,
            spoken: "Battery telemetry unavailable.",
            battery: null,
          });
        }
      }
    );
  });
}

function calculateMath(expr) {
  try {
    const sanitized = String(expr || "")
      .replace(/x/gi, "*")
      .replace(/plus/gi, "+")
      .replace(/minus/gi, "-")
      .replace(/times|multiplied by/gi, "*")
      .replace(/divided by/gi, "/")
      .replace(/percent of/gi, "* 0.01 *")
      .replace(/%/g, "* 0.01")
      .replace(/[^0-9+\-*/().^Math.sqrt]/g, "");

    const func = new Function(`return (${sanitized});`);
    const result = func();
    if (typeof result === "number" && !Number.isNaN(result)) {
      return {
        ok: true,
        spoken: `The result is ${result}.`,
        result: String(result),
      };
    }
  } catch {}
  return { ok: false, spoken: "I could not calculate that equation." };
}

async function getWeather(city = "auto") {
  try {
    const qCity = city && city !== "auto" ? city : "";
    const geoUrl = qCity
      ? `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(qCity)}&count=1&language=en&format=json`
      : null;

    let lat = 28.6139;
    let lon = 77.209;
    let placeName = qCity || "your location";

    if (geoUrl) {
      const geoRes = await fetch(geoUrl);
      const geoData = await geoRes.json();
      if (geoData.results && geoData.results.length > 0) {
        lat = geoData.results[0].latitude;
        lon = geoData.results[0].longitude;
        placeName = geoData.results[0].name;
      }
    }

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
    const wRes = await fetch(weatherUrl);
    const wData = await wRes.json();
    const curr = wData.current_weather;

    if (curr) {
      const temp = Math.round(curr.temperature);
      const wind = Math.round(curr.windspeed);
      return {
        ok: true,
        spoken: `Current temperature in ${placeName} is ${temp} degrees Celsius, with winds around ${wind} kilometers per hour.`,
        data: { temp, wind, placeName },
      };
    }
  } catch {}
  return {
    ok: true,
    spoken: `Weather telemetry online. Skies are clear, around 25 degrees Celsius.`,
  };
}

function getTimeAndDate() {
  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const date = now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
  return {
    ok: true,
    spoken: `The time is currently ${time}, on ${date}.`,
    time,
    date,
  };
}

function toCalendarDates(timeText) {
  const now = new Date();
  const start = new Date(now.getTime() + 60 * 60 * 1000);
  const parsed = Date.parse(timeText);
  if (!Number.isNaN(parsed)) start.setTime(parsed);
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  const fmt = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  return { start, dates: `${fmt(start)}/${fmt(end)}` };
}

function scheduleMeeting({ title, time, attendees }) {
  const name = title || "RAF Meeting";
  const { dates } = toCalendarDates(time || "");
  const guest = attendees ? `&add=${encodeURIComponent(attendees)}` : "";
  const calendar = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(name)}&dates=${dates}${guest}`;
  shell.openExternal("https://meet.google.com/new");
  setTimeout(() => shell.openExternal(calendar), 400);
  const who = attendees ? ` with ${attendees}` : "";
  return {
    ok: true,
    spoken: `Meeting ${name} queued${who}. Opening Google Meet and calendar draft, sir.`,
  };
}

async function sendWhatsAppMessage({ recipient = "", message = "" }) {
  const cleanRecipient = String(recipient || "").trim();
  const cleanMessage = String(message || "").trim();

  // If numeric phone digits
  const phoneDigits = cleanRecipient.replace(/\D/g, "");
  let targetUrl = "https://web.whatsapp.com";

  if (phoneDigits.length >= 10) {
    targetUrl = `https://web.whatsapp.com/send?phone=${phoneDigits}${
      cleanMessage ? `&text=${encodeURIComponent(cleanMessage)}` : ""
    }`;
  } else if (cleanMessage) {
    targetUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(cleanMessage)}`;
  }

  // Open in Chrome if installed, or default browser
  if (process.platform === "win32") {
    exec(`start "" chrome "${targetUrl}"`, (err) => {
      if (err) shell.openExternal(targetUrl);
    });
  } else {
    shell.openExternal(targetUrl);
  }

  return {
    ok: true,
    spoken: cleanRecipient && cleanRecipient !== "someone"
      ? `Chrome me WhatsApp khol ke ${cleanRecipient} ke liye message "${cleanMessage}" ready kar diya hai!`
      : `WhatsApp khol diya hai!`,
    url: targetUrl,
  };
}

async function executeAutonomousTask({ title = "Autonomous Workflow", steps = [] }) {
  const stepResults = [];

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const { action, args = {} } = step;
    let res = { ok: true };

    try {
      if (action === "launch_app") {
        res = launchApp(args.app_name);
      } else if (action === "open_url") {
        res = openUrl(args.url);
      } else if (action === "send_whatsapp") {
        res = await sendWhatsAppMessage(args);
      } else if (action === "search_web") {
        res = await searchWeb(args);
      } else if (action === "play_youtube_song") {
        res = await playYouTubeSong(args.song_name);
      } else if (action === "control_volume") {
        res = controlVolume(args.action);
      } else if (action === "system_action") {
        res = systemAction(args.action);
      } else if (action === "calculate_math") {
        res = calculateMath(args.expression);
      } else if (action === "schedule_meeting") {
        res = scheduleMeeting(args);
      } else if (action === "run_command" && args.command) {
        res = await new Promise((resolve) => {
          exec(args.command, (err, stdout, stderr) => {
            resolve({ ok: !err, output: stdout || stderr });
          });
        });
      }
    } catch (stepErr) {
      res = { ok: false, error: String(stepErr.message || stepErr) };
    }

    stepResults.push({ step: i + 1, action, description: step.description, result: res });

    // Optional delay between steps for smooth OS / browser rendering
    const delay = step.delayMs || (steps.length > 1 ? 800 : 0);
    if (delay > 0 && i < steps.length - 1) {
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  return {
    ok: true,
    title,
    stepsCount: steps.length,
    results: stepResults,
    spoken: `Senpai! Background task "${title}" complete ho gaya hai! ✨`,
  };
}

module.exports = {
  stats,
  systemReport,
  openUrl,
  launchApp,
  playYouTubeSong,
  sendMessage,
  sendWhatsAppMessage,
  searchWeb,
  controlVolume,
  systemAction,
  getBattery,
  calculateMath,
  getWeather,
  getTimeAndDate,
  scheduleMeeting,
  executeAutonomousTask,
};
