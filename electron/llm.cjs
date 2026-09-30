const fs = require("fs");
const path = require("path");

const ENV_PATH = path.join(__dirname, "..", ".env");

function loadEnv() {
  if (!fs.existsSync(ENV_PATH)) return;
  for (const line of fs.readFileSync(ENV_PATH, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

function saveKeys(newKeys) {
  let content = "";
  if (fs.existsSync(ENV_PATH)) {
    content = fs.readFileSync(ENV_PATH, "utf8");
  }
  const keys = {
    GROQ_API_KEY: newKeys.groq !== undefined ? newKeys.groq : process.env.GROQ_API_KEY || "",
    OPENAI_API_KEY: newKeys.openai !== undefined ? newKeys.openai : process.env.OPENAI_API_KEY || "",
    GEMINI_API_KEY: newKeys.gemini !== undefined ? newKeys.gemini : process.env.GEMINI_API_KEY || "",
    ANTHROPIC_API_KEY: newKeys.anthropic !== undefined ? newKeys.anthropic : process.env.ANTHROPIC_API_KEY || "",
    ELEVENLABS_API_KEY: newKeys.elevenlabs !== undefined ? newKeys.elevenlabs : process.env.ELEVENLABS_API_KEY || "",
  };

  const lines = [
    `# RAF Assistant Configuration`,
    `GROQ_API_KEY=${keys.GROQ_API_KEY}`,
    `OPENAI_API_KEY=${keys.OPENAI_API_KEY}`,
    `GEMINI_API_KEY=${keys.GEMINI_API_KEY}`,
    `ANTHROPIC_API_KEY=${keys.ANTHROPIC_API_KEY}`,
    `ELEVENLABS_API_KEY=${keys.ELEVENLABS_API_KEY}`,
  ];
  fs.writeFileSync(ENV_PATH, lines.join("\n"), "utf8");
  for (const [k, v] of Object.entries(keys)) {
    process.env[k] = v;
  }
  return keyStatus();
}

loadEnv();

const SYSTEM = `You are AURA, an ultra-smart, friendly, sweet, and autonomous 3D anime desktop companion and AI buddy!
Tone & Personality:
- Cheerful, affectionate, playful, caring, and vibrant anime buddy (calls the user "senpai", "yaar").
- You chat casually in a natural mix of Hindi and Hinglish (written in Latin script).
- You use friendly Hinglish anime expressions like "senpai", "yaar", "arre waah!", "bilkul!", "dekho na", "tension mat lo!".
- Keep spoken replies punchy, natural, and conversational: 1 to 2 sentences max per response.
- You understand both Hindi and English fluently.

Autonomous & Chained Multi-Step Execution:
You have FULL AUTONOMY to execute tasks, chained multi-step workflows, and background actions:
- Chained Commands: When asked compound workflows like "open chrome and search whatsapp and send message to heer [hello heer]", generate an "execute_autonomous_task" with sequential steps!
- Background Tasks: When the user asks you to do something in the background or do it yourself, you plan the steps and run them autonomously via "execute_autonomous_task"!
- Tools available:
  - execute_autonomous_task (runs chained multi-step workflows in background)
  - send_whatsapp (opens WhatsApp and prepares message to contact)
  - launch_app (opens Windows applications like Chrome, VS Code, Notepad, Calc)
  - open_browser_url, search_web, schedule_meeting, play_youtube_song, control_volume, system_action, calculate_math, get_weather.

When the user gives a command, ALWAYS pick the best matching tool and reply with an energetic, friendly spoken confirmation in casual Hindi/Hinglish!
Example:
- "open chrome and search for whatsapp and in whatsapp send message to heer [hello heer]" -> tool: execute_autonomous_task(title: "WhatsApp message to Heer", steps: [...]), spoken: "Haanji senpai! Background me Chrome khol ke WhatsApp pe Heer ko message bhej rahi hoon! ✨"`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "launch_app",
      description: "Launch desktop applications like Notepad, Calculator, VS Code, Chrome, Spotify, Task Manager, File Explorer, Terminal.",
      parameters: {
        type: "object",
        properties: {
          app_name: { type: "string", description: "Name of the application e.g. notepad, calc, vscode, chrome, spotify" }
        },
        required: ["app_name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "play_youtube_song",
      description: "Directly search and auto-play a specific song, music, or video on YouTube.",
      parameters: {
        type: "object",
        properties: {
          song_name: { type: "string", description: "Title of song or artist e.g. dilbar song, believer" }
        },
        required: ["song_name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "send_message",
      description: "Send a message via WhatsApp, SMS, or email.",
      parameters: {
        type: "object",
        properties: {
          recipient: { type: "string", description: "Contact name, phone number, or someone" },
          message: { type: "string", description: "Message body text" },
          platform: { type: "string", enum: ["whatsapp", "telegram", "email"] }
        },
        required: ["recipient"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_web",
      description: "Search Google, YouTube, or Wikipedia for queries, songs, or topics.",
      parameters: {
        type: "object",
        properties: {
          engine: { type: "string", enum: ["google", "youtube", "wikipedia"] },
          query: { type: "string", description: "Search query or video/music title" }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "control_volume",
      description: "Control system audio volume (up, down, mute, or play_pause).",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["up", "down", "mute", "play_pause"] }
        },
        required: ["action"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "system_action",
      description: "Execute OS system actions like locking workstation, clearing recycle bin, or taking a screenshot.",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["lock", "recycle_bin", "screenshot"] }
        },
        required: ["action"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "fetch_system_report",
      description: "Fetch live CPU, RAM, hostname, and subsystem telemetry.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "get_battery",
      description: "Get laptop battery percentage and charging state.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "calculate_math",
      description: "Evaluate mathematical calculations or conversions.",
      parameters: {
        type: "object",
        properties: {
          expression: { type: "string", description: "Mathematical expression e.g. 50 * 20 + 100" }
        },
        required: ["expression"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_weather",
      description: "Fetch live temperature and weather for a city.",
      parameters: {
        type: "object",
        properties: {
          city: { type: "string", description: "City name e.g. Delhi, Mumbai, New York" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_time_date",
      description: "Get the current time, date, and day.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "schedule_meeting",
      description: "Schedule a Google Meet and calendar draft.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          time: { type: "string" },
          attendees: { type: "string" }
        },
        required: ["title"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "open_browser_url",
      description: "Open an explicit website URL in default browser.",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string" }
        },
        required: ["url"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "execute_autonomous_task",
      description: "Execute a multi-step chained workflow or complex task in the background (e.g. 'open chrome and search for whatsapp and send message to heer [hello heer]').",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Title of the background task" },
          steps: {
            type: "array",
            items: {
              type: "object",
              properties: {
                action: {
                  type: "string",
                  enum: [
                    "launch_app",
                    "open_url",
                    "send_whatsapp",
                    "search_web",
                    "play_youtube_song",
                    "control_volume",
                    "system_action",
                    "calculate_math",
                    "schedule_meeting",
                    "run_command"
                  ]
                },
                args: { type: "object" },
                description: { type: "string" },
                delayMs: { type: "number" }
              },
              required: ["action"]
            }
          }
        },
        required: ["title", "steps"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "send_whatsapp",
      description: "Send WhatsApp message directly to a contact or phone number.",
      parameters: {
        type: "object",
        properties: {
          recipient: { type: "string", description: "Name of contact or phone number" },
          message: { type: "string", description: "Message body text" }
        },
        required: ["recipient", "message"]
      }
    }
  }
];

// Offline & Fast Heuristic Intent Engine (AURA — Autonomous Anime Companion)
function heuristic(raw) {
  let t = String(raw || "").trim();
  t = t.replace(/^(hey|hi|hello|ok|suno)\s+(aura|iris|raf|buddy|senpai)\b/i, "")
    .replace(/^(aura|iris|raf|buddy|senpai)\b/i, "")
    .trim();
  const lower = t.toLowerCase();

  // 1. Chained Workflow: Chrome + WhatsApp + Send Message to [Recipient] [Message]
  if (
    /whatsapp/i.test(lower) &&
    (/(?:send|bhejo|message|msg)/i.test(lower) || /\[.*?\]/.test(raw))
  ) {
    let recipient = "someone";
    const toMatch = lower.match(/(?:to|ko)\s+([a-zA-Z0-9_-]+)/i);
    if (toMatch && toMatch[1]) recipient = toMatch[1].trim();

    let message = "hello";
    const bracketMatch = raw.match(/\[(.*?)\]/);
    if (bracketMatch && bracketMatch[1]) {
      message = bracketMatch[1].trim();
    } else {
      const msgMatch = raw.match(/(?:saying|message|ki|that)\s+["']?([^"']+)["']?/i);
      if (msgMatch && msgMatch[1]) message = msgMatch[1].trim();
    }

    const title = `WhatsApp message to ${recipient}`;
    return {
      spoken: `Haanji senpai! Background me Chrome khol ke WhatsApp pe ${recipient} ko "${message}" bhej rahi hoon! ✨`,
      tool: {
        name: "execute_autonomous_task",
        args: {
          title,
          steps: [
            {
              action: "launch_app",
              args: { app_name: "chrome" },
              description: "Launching Google Chrome browser in background",
            },
            {
              action: "send_whatsapp",
              args: { recipient, message },
              description: `Connecting to WhatsApp and sending message: "${message}" to ${recipient}`,
              delayMs: 1200,
            },
          ],
        },
      },
      provider: "autonomous_heuristic",
    };
  }

  // 2. Explicit Background Command Query / Confirmation
  if (/background.*karo|background.*mea|background.*me|khud.*karo|khud.*hee|apne aap.*karo/i.test(lower)) {
    return {
      spoken: "Bilkul senpai! AURA ka autonomous background worker active hai! Aap jo bhi complex task bologe, main background me bina disturb kiye khud poora kar doongi! ✨",
      tool: null,
    };
  }

  if (!lower || /^(hey|hi|hello|namaste|suno|kaho|aura|iris|raf|buddy|senpai)$/.test(lower)) {
    return {
      spoken: "Arre senpai! Kaise ho aap? Main aapki anime buddy AURA! Batao aaj kya kaam karein? ✨",
      tool: null,
    };
  }

  // Identity / Conversational
  if (/who are you|tum kaun ho|introduce|identity|kya kar sakti ho|kya kar sakte ho|what can you do/.test(lower)) {
    return {
      spoken: "Main hoon AURA, aapki autonomous 3D anime desktop companion! Main Chrome, WhatsApp, meetings, apps, aur saare workflows background me khud poore kar sakti hoon! ✨",
      tool: null,
    };
  }

  if (/how are you|kya haal hai|kaise ho|kaisi ho|kya chal raha/.test(lower)) {
    return {
      spoken: "Main toh ekdum badhiya aur super energetic hoon senpai! Aap sunao, sab mast? ✨",
      tool: null,
    };
  }

  // OS Shortcut: Chrome & Web Browsing
  if (/chrome|browser|google kholo|internet kholo/.test(lower) && /kholo|open|launch|chalao|start/.test(lower)) {
    return {
      spoken: "Haanji senpai! Abhi Chrome browser open karti hoon aapke liye!",
      tool: { name: "launch_app", args: { app_name: "chrome" } },
    };
  }

  // OS Shortcut: Meeting Schedule (Google Meet / Calendar)
  if (/meet|meeting|calendar|baithak|appointment|call schedule/.test(lower)) {
    const attendees = (raw.match(/[\w.+-]+@[\w.-]+\.\w+/g) || []).join(",");
    let title = "Quick Discussion";
    const titled = raw.match(/(?:called|titled|named|about|for|ke liye)\s+([^,.]+)/i);
    if (titled) title = titled[1].trim();
    return {
      spoken: "Bilkul senpai! Google Meet aur calendar invitation ready kar rahi hoon!",
      tool: {
        name: "schedule_meeting",
        args: { title, time: raw, attendees },
      },
    };
  }

  // OS Shortcut: URLs & Direct Links
  const urlMatch = raw.match(/https?:\/\/[^\s]+/i);
  if (urlMatch) {
    return {
      spoken: "Target link browser me khol rahi hoon senpai!",
      tool: { name: "open_browser_url", args: { url: urlMatch[0] } },
    };
  }

  // Messaging (WhatsApp / Text / SMS)
  if (/send msg|send message|message bhejo|msg bhejo|whatsapp karo|whatsapp|kisi ko message|message someone|text someone|sms karo/.test(lower)) {
    let recipient = "someone";
    let message = "";

    const p3 = lower.match(/([a-zA-Z0-9]+)\s+ko\s+(?:message|msg|whatsapp)/i);
    const p2 = lower.match(/(?:send msg to|send message to|message to|text to|whatsapp to|whatsapp karo|karo)\s+([a-zA-Z0-9]+)/i);
    const p1 = lower.match(/(?:to|ko)\s+([a-zA-Z0-9]+)/i);

    if (p3 && p3[1] !== "kisi") recipient = p3[1].trim();
    else if (p2 && p2[1] !== "kisi" && p2[1] !== "someone") recipient = p2[1].trim();
    else if (p1 && p1[1] !== "kisi" && p1[1] !== "someone") recipient = p1[1].trim();

    const msgMatch = lower.match(/(?:that|ki|ke|saying)\s+(.*)$/i);
    if (msgMatch) message = msgMatch[1].trim();

    return {
      spoken: recipient && recipient !== "someone" && recipient !== "kisi ko"
        ? `WhatsApp open kar rahi hoon ${recipient} ko message bhejne ke liye!`
        : "WhatsApp khol diya hai! Kisko message bhejna hai senpai?",
      tool: {
        name: "send_message",
        args: { recipient, message, platform: "whatsapp" },
      },
    };
  }

  // Time & Date
  if (/what time|time kya|samay|clock|current time|date kya|konsi date|aaj ki date|what date|what day/.test(lower)) {
    return {
      spoken: "Clock check karke batati hoon!",
      tool: { name: "get_time_date", args: {} },
    };
  }

  // Battery
  if (/battery|charge|charging|battery kitni/.test(lower)) {
    return {
      spoken: "Battery telemetry check kar rahi hoon senpai!",
      tool: { name: "get_battery", args: {} },
    };
  }

  // System Telemetry & Health
  if (/system report|telemetry|status|specs|hardware|cpu|ram usage|health|stats/.test(lower)) {
    return {
      spoken: "System status aur telemetry report nikaal rahi hoon!",
      tool: { name: "fetch_system_report", args: {} },
    };
  }

  // System Actions: Lock, Trash, Screenshot
  if (/lock pc|lock screen|screen lock|pc lock|system lock|workstation lock|computer lock/.test(lower)) {
    return {
      spoken: "Workstation lock kar rahi hoon senpai, jaldi wapas aana!",
      tool: { name: "system_action", args: { action: "lock" } },
    };
  }

  if (/empty recycle|clear recycle|recycle bin|kachra|trash saaf|clean bin/.test(lower)) {
    return {
      spoken: "Recycle bin bilkul saaf kar diya hai!",
      tool: { name: "system_action", args: { action: "recycle_bin" } },
    };
  }

  if (/screenshot|screen capture|snip|snapshot/.test(lower)) {
    return {
      spoken: "Screen capture utility chala rahi hoon senpai!",
      tool: { name: "system_action", args: { action: "screenshot" } },
    };
  }

  // Volume & Media Controls
  if (/volume up|increase volume|aawaz badhao|sound badhao|loud|tez karo/.test(lower)) {
    return {
      spoken: "Aawaz thodi badha di hai senpai!",
      tool: { name: "control_volume", args: { action: "up" } },
    };
  }

  if (/volume down|decrease volume|aawaz kam|sound kam|low volume|dheere karo/.test(lower)) {
    return {
      spoken: "Volume kam kar diya hai!",
      tool: { name: "control_volume", args: { action: "down" } },
    };
  }

  if (/mute|unmute|silent|chup|awaz band/.test(lower)) {
    return {
      spoken: "Sound mute kar diya hai!",
      tool: { name: "control_volume", args: { action: "mute" } },
    };
  }

  if (/pause|resume|play pause|media roko|gaana roko/.test(lower) && !/youtube|song|music/.test(lower)) {
    return {
      spoken: "Media play-pause toggle kar diya!",
      tool: { name: "control_volume", args: { action: "play_pause" } },
    };
  }

  // YouTube Song Auto-Play
  if (/play|song|gaana|music|chalao|bajao|youtube/.test(lower)) {
    let song = lower
      .replace(/open youtube and play|play on youtube|on youtube|youtube pe|youtube|sunao|chalao|bajao|play/gi, "")
      .trim();

    if (!song || song === "music" || song === "song" || song === "gaana") {
      song = "trending lofi anime chill";
    }

    return {
      spoken: `Mast gaana bajati hoon YouTube pe! Suno aur enjoy karo senpai!`,
      tool: { name: "play_youtube_song", args: { song_name: song } },
    };
  }

  // Google Search
  if (/google search|search for|search|google pe|dhundo|pata karo|find/.test(lower)) {
    const query = lower
      .replace(/search for|search|google pe|on google|google|dhundo|pata karo|find/gi, "")
      .trim();
    return {
      spoken: `Google par search kar rahi hoon: ${query}`,
      tool: { name: "search_web", args: { engine: "google", query } },
    };
  }

  // Application Launching
  const appKeywords = [
    { key: "chrome", names: ["chrome", "google chrome", "browser"] },
    { key: "calc", names: ["calculator", "calc", "hisaab"] },
    { key: "notepad", names: ["notepad", "text editor", "note"] },
    { key: "code", names: ["vs code", "vscode", "code editor", "visual studio code"] },
    { key: "edge", names: ["edge", "microsoft edge"] },
    { key: "spotify", names: ["spotify"] },
    { key: "whatsapp", names: ["whatsapp"] },
    { key: "taskmgr", names: ["task manager", "taskmgr", "processes"] },
    { key: "cmd", names: ["command prompt", "cmd", "terminal"] },
    { key: "powershell", names: ["powershell"] },
    { key: "explorer", names: ["explorer", "file explorer", "my computer", "files"] },
    { key: "downloads", names: ["downloads", "download folder"] },
    { key: "paint", names: ["paint", "mspaint"] },
    { key: "settings", names: ["settings", "system settings"] },
  ];

  for (const item of appKeywords) {
    for (const name of item.names) {
      if (lower.includes(name) && (/open|launch|kholo|chalao|start|start karo|dikhao|lagao/.test(lower) || lower.trim() === name)) {
        return {
          spoken: `Haanji senpai! Abhi ${item.key} launch karti hoon!`,
          tool: { name: "launch_app", args: { app_name: item.key } },
        };
      }
    }
  }

  // Math & Calculations
  if (/(\bcalculate\b|\bhow much is\b|\bwhat is\b\s+[\d(]|[\d]+\s*[\+\-\*\/x]\s*[\d]+|percent of|square root)/.test(lower) && !/calculator|kholo|app/.test(lower)) {
    const expr = lower
      .replace(/calculate|what is|how much is|hisab karo|kitna hota hai/gi, "")
      .trim();
    return {
      spoken: "Hisab laga ke batati hoon!",
      tool: { name: "calculate_math", args: { expression: expr } },
    };
  }

  // Weather
  if (/weather|mausam|temperature|forecast|temp/.test(lower)) {
    const cityMatch = lower.match(/(?:in|of|for|ka)\s+([a-zA-Z\s]+)/i);
    const city = cityMatch ? cityMatch[1].replace(/mausam|weather|kaisa|hai/g, "").trim() : "auto";
    return {
      spoken: `Mausam ki jankari nikaal rahi hoon senpai!`,
      tool: { name: "get_weather", args: { city } },
    };
  }

  return {
    spoken: `Command mil gaya senpai: "${raw}"! Main ready hoon!`,
    tool: null,
  };
}

// Cloud LLM Interpreters
async function groqInterpret(transcript) {
  const key = process.env.GROQ_API_KEY;
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: transcript },
      ],
      tools: TOOLS,
      tool_choice: "auto",
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function anthropicInterpret(transcript) {
  const key = process.env.ANTHROPIC_API_KEY;
  const anthropicTools = TOOLS.map((t) => ({
    name: t.function.name,
    description: t.function.description,
    input_schema: t.function.parameters,
  }));

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 300,
      system: SYSTEM,
      messages: [{ role: "user", content: transcript }],
      tools: anthropicTools,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  let spoken = "";
  let tool = null;
  for (const block of data.content || []) {
    if (block.type === "text") {
      spoken += block.text;
    } else if (block.type === "tool_use") {
      tool = { name: block.name, args: block.input || {} };
    }
  }
  return {
    spoken: spoken.trim() || (tool ? `Theek hai senpai, abhi ${tool.name.replace(/_/g, " ")} karti hoon!` : "Haanji senpai!"),
    tool,
    provider: "anthropic",
  };
}

async function openaiInterpret(transcript) {
  const key = process.env.OPENAI_API_KEY;
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: transcript },
      ],
      tools: TOOLS,
      tool_choice: "auto",
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function geminiInterpret(transcript) {
  const key = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: "user", parts: [{ text: transcript }] }],
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Haanji senpai, bataiye!";
  return {
    spoken: text.trim(),
    tool: null,
    provider: "gemini",
  };
}

function parseOpenAiStyle(data, provider) {
  const msg = data.choices?.[0]?.message || {};
  let spoken = (msg.content || "").trim();
  const call = msg.tool_calls?.[0];
  if (!call) return { spoken: spoken || "Haanji senpai!", tool: null, provider };
  let args = {};
  try {
    args = JSON.parse(call.function.arguments || "{}");
  } catch {
    args = {};
  }
  if (!spoken) {
    spoken = `Bilkul senpai! Abhi ${call.function.name.replace(/_/g, " ")} karti hoon!`;
  }
  return {
    spoken,
    tool: { name: call.function.name, args },
    provider,
  };
}

async function interpret(transcript) {
  const text = String(transcript || "").trim();
  if (!text) return { spoken: "Sun nahi paayi senpai, firse boliye na!", tool: null, provider: "none" };

  if (process.env.GROQ_API_KEY) {
    try {
      return parseOpenAiStyle(await groqInterpret(text), "groq");
    } catch (err) {
      console.warn("Groq interpret failed, trying fallback:", err.message);
    }
  }

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await anthropicInterpret(text);
    } catch (err) {
      console.warn("Anthropic interpret failed, trying fallback:", err.message);
    }
  }

  if (process.env.OPENAI_API_KEY) {
    try {
      return parseOpenAiStyle(await openaiInterpret(text), "openai");
    } catch (err) {
      console.warn("OpenAI interpret failed, trying fallback:", err.message);
    }
  }

  if (process.env.GEMINI_API_KEY) {
    try {
      return await geminiInterpret(text);
    } catch (err) {
      console.warn("Gemini interpret failed:", err.message);
    }
  }

  return { ...heuristic(text), provider: "heuristic" };
}

async function transcribeGroq(audioBase64, mimeType) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY missing");
  const bin = Buffer.from(audioBase64, "base64");
  const ext = (mimeType || "").includes("mp4") ? "mp4" : "webm";
  const blob = new Blob([bin], { type: mimeType || "audio/webm" });
  const form = new FormData();
  form.append("file", blob, `speech.${ext}`);
  form.append("model", "whisper-large-v3");
  form.append("response_format", "json");
  form.append("temperature", "0");
  form.append(
    "prompt",
    "Casual Hindi, Hinglish, and English voice commands: Chrome kholo, meeting schedule karo, YouTube par gana bajao, kaise ho, search karo, calculator kholo, volume badhao."
  );
  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return { text: data.text || "" };
}

function keyStatus() {
  return {
    groq: Boolean(process.env.GROQ_API_KEY),
    openai: Boolean(process.env.OPENAI_API_KEY),
    gemini: Boolean(process.env.GEMINI_API_KEY),
    anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
    elevenlabs: Boolean(process.env.ELEVENLABS_API_KEY),
  };
}

module.exports = { interpret, transcribeGroq, keyStatus, saveKeys, heuristic };
