import { useCallback, useEffect, useRef, useState } from "react";
import {
  Mic,
  MicOff,
  Send,
  Settings,
  HelpCircle,
  Smartphone,
  Cpu,
  Radio,
  Zap,
  Music,
  FileText,
  Calculator,
  CloudSun,
  Lock,
  Volume2,
  Disc,
  Sparkles,
  Globe,
  Calendar,
  Layers,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  Play,
} from "lucide-react";
import LeftHud from "./components/LeftHud";
import VrmAvatar from "./components/VrmAvatar";
import ParticleOrb from "./components/ParticleOrb";
import RightHud from "./components/RightHud";
import SettingsModal from "./components/SettingsModal";
import HelpModal from "./components/HelpModal";
import { useMicAnalyser } from "./hooks/useMicAnalyser";
import { useSpeech } from "./hooks/useSpeech";
import type { RafMode, LogLine, SystemStats, BatteryInfo, KeyStatus } from "./types";

export interface BackgroundTask {
  id: string;
  title: string;
  status: "running" | "completed" | "failed";
  steps: Array<{ action: string; description: string; done?: boolean }>;
  currentStepIndex: number;
  progress: number;
  startedAt: string;
}

function stamp() {
  return new Date().toLocaleTimeString("en-GB", { hour12: false });
}

// -------------------------------------------------------------
// Web Audio API Pipeline for ElevenLabs Audio Stream Lip-Sync
// -------------------------------------------------------------
let globalAudioCtx: AudioContext | null = null;
let globalTtsAnalyser: AnalyserNode | null = null;
let globalSourceNode: AudioBufferSourceNode | null = null;

function getAudioPipelines(): { ctx: AudioContext; analyser: AnalyserNode } {
  if (!globalAudioCtx) {
    const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
    globalAudioCtx = new AudioCtor();
    globalTtsAnalyser = globalAudioCtx.createAnalyser();
    globalTtsAnalyser.fftSize = 256;
    globalTtsAnalyser.smoothingTimeConstant = 0.35;
  }
  if (globalAudioCtx.state === "suspended") {
    globalAudioCtx.resume().catch(() => {});
  }
  return { ctx: globalAudioCtx, analyser: globalTtsAnalyser! };
}

function playElevenLabsStream(mime: string, b64: string): Promise<void> {
  return new Promise((resolve) => {
    try {
      const { ctx, analyser } = getAudioPipelines();

      if (globalSourceNode) {
        try {
          globalSourceNode.stop();
        } catch {}
        globalSourceNode = null;
      }

      const binary = atob(b64);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      ctx.decodeAudioData(
        bytes.buffer.slice(0),
        (decodedBuffer) => {
          const source = ctx.createBufferSource();
          source.buffer = decodedBuffer;
          source.connect(analyser);
          analyser.connect(ctx.destination);
          globalSourceNode = source;

          source.onended = () => {
            globalSourceNode = null;
            resolve();
          };

          source.start(0);
        },
        (decodeErr) => {
          console.warn("decodeAudioData failed, playing via Audio element:", decodeErr);
          const audio = new Audio(`data:${mime};base64,${b64}`);
          audio.onended = () => resolve();
          audio.onerror = () => resolve();
          audio.play().catch(() => resolve());
        }
      );
    } catch (err) {
      console.warn("WebAudio stream failed, fallback to Audio element:", err);
      const audio = new Audio(`data:${mime};base64,${b64}`);
      audio.onended = () => resolve();
      audio.onerror = () => resolve();
      audio.play().catch(() => resolve());
    }
  });
}

export default function App() {
  const [mode, setMode] = useState<RafMode>("idle");
  const [viewMode, setViewMode] = useState<"avatar" | "orb">("avatar");
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [battery, setBattery] = useState<BatteryInfo | null>(null);
  const [ttsAnalyser, setTtsAnalyser] = useState<AnalyserNode | null>(null);
  const [backgroundTasks, setBackgroundTasks] = useState<BackgroundTask[]>([]);

  const [logs, setLogs] = useState<LogLine[]>([
    {
      id: "boot-1",
      ts: stamp(),
      kind: "sys",
      text: "AURA Autonomous 3D Anime Desktop Companion online. Background execution engine armed.",
    },
    {
      id: "boot-2",
      ts: stamp(),
      kind: "aura" as any,
      text: "Konnichiwa senpai! Main AURA hoon! Jo bhi kaam bologe, main khud background me poora kar doongi! ✨",
    },
  ]);

  const [keys, setKeys] = useState<KeyStatus>({
    groq: false,
    openai: false,
    gemini: false,
    anthropic: false,
    elevenlabs: false,
  });

  const [autostart, setAutostart] = useState(true);
  const [localIp, setLocalIp] = useState("localhost");
  const [typed, setTyped] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const busy = useRef(false);

  const bridge = typeof window !== "undefined" ? window.aura || window.raf || window.iris : undefined;

  const micOn = mode === "listening" || mode === "speaking";
  const { amplitude, bands } = useMicAnalyser(micOn);

  const pushLog = useCallback((kind: LogLine["kind"], text: string) => {
    setLogs((prev) => [...prev.slice(-100), { id: crypto.randomUUID(), ts: stamp(), kind, text }]);
  }, []);

  // Fetch telemetry & keys
  useEffect(() => {
    bridge?.hasKeys().then(setKeys).catch(() => undefined);
    bridge?.getAutostart().then((s) => setAutostart(s.enabled)).catch(() => undefined);
    bridge?.getLocalIp().then((res) => setLocalIp(res.ip)).catch(() => undefined);
    bridge?.getBattery().then((res) => setBattery(res.battery)).catch(() => undefined);

    const tick = () => {
      bridge?.getStats().then(setStats).catch(() => undefined);
    };
    tick();
    const id = setInterval(tick, 1500);
    return () => clearInterval(id);
  }, [bridge]);

  // Vocal speaking with ElevenLabs real-time mouth blendshape sync
  const speak = useCallback(
    async (text: string) => {
      setMode("speaking");
      pushLog("aura", text);

      if (!bridge) {
        window.speechSynthesis?.speak(new SpeechSynthesisUtterance(text));
        setMode("idle");
        return;
      }

      try {
        const result = await bridge.speak(text);
        if (result.audioBase64 && result.mime) {
          const pipelines = getAudioPipelines();
          setTtsAnalyser(pipelines.analyser);
          await playElevenLabsStream(result.mime, result.audioBase64);
        }
      } catch (err) {
        console.warn("Speech playback error:", err);
      } finally {
        setMode("idle");
        setTtsAnalyser(null);
      }
    },
    [bridge, pushLog]
  );

  // Command Execution Hub with Full Autonomous Chained Workflows
  const runTranscript = useCallback(
    async (rawText: string) => {
      const text = rawText.trim();
      if (!text || busy.current) return;
      busy.current = true;
      pushLog("user", text);
      setMode("thinking");

      try {
        if (!bridge) {
          await speak("Bridge offline hai senpai, desktop shell me test kijiye!");
          return;
        }

        const intent = await bridge.interpret(text);
        let confirmation = intent.spoken;

        if (intent.tool) {
          const name = intent.tool.name;
          const args = intent.tool.args as Record<string, any>;
          pushLog("tool", `${name} ${JSON.stringify(args)}`);

          // 1. Autonomous Chained Task Execution (e.g. Chrome -> WhatsApp -> Send message to Heer)
          if (name === "execute_autonomous_task") {
            const taskTitle = String(args.title || "Autonomous Workflow");
            const taskSteps = Array.isArray(args.steps) ? args.steps : [];

            // Acknowledge right away so user is informed without waiting
            await speak(confirmation);

            const taskId = crypto.randomUUID();
            const newTask: BackgroundTask = {
              id: taskId,
              title: taskTitle,
              status: "running",
              steps: taskSteps.map((s: any) => ({
                action: s.action || "step",
                description: s.description || s.action || "Executing step...",
                done: false,
              })),
              currentStepIndex: 0,
              progress: 20,
              startedAt: stamp(),
            };

            setBackgroundTasks((prev) => [newTask, ...prev.slice(0, 3)]);
            pushLog("sys", `⚡ [AURA BACKGROUND WORKER]: Started "${taskTitle}"`);

            // Execute asynchronously in background! User continues unblocked!
            (async () => {
              try {
                for (let sIdx = 0; sIdx < taskSteps.length; sIdx++) {
                  const step = taskSteps[sIdx];
                  setBackgroundTasks((prev) =>
                    prev.map((t) =>
                      t.id === taskId
                        ? {
                            ...t,
                            currentStepIndex: sIdx,
                            progress: Math.round(((sIdx + 0.6) / taskSteps.length) * 100),
                          }
                        : t
                    )
                  );
                  pushLog("tool", `[Step ${sIdx + 1}/${taskSteps.length}]: ${step.description || step.action}`);
                  await new Promise((r) => setTimeout(r, 600));
                }

                const r = await bridge.runAutonomousTask({ title: taskTitle, steps: taskSteps });

                setBackgroundTasks((prev) =>
                  prev.map((t) =>
                    t.id === taskId
                      ? {
                          ...t,
                          status: "completed",
                          progress: 100,
                          steps: t.steps.map((st) => ({ ...st, done: true })),
                        }
                      : t
                  )
                );

                pushLog("aura" as any, `✅ [TASK COMPLETED]: ${taskTitle}`);
                await speak(r.spoken || `Senpai! Background task "${taskTitle}" complete ho gaya hai! ✨`);
              } catch (err: any) {
                console.error("Background task error:", err);
                setBackgroundTasks((prev) =>
                  prev.map((t) => (t.id === taskId ? { ...t, status: "failed", progress: 100 } : t))
                );
                pushLog("sys", `❌ [TASK FAILED]: ${err.message || err}`);
                await speak(`Senpai, background task me error aa gaya.`);
              }
            })();

            busy.current = false;
            setMode("idle");
            return;
          }

          // 2. Direct Tools Execution
          setMode("executing");

          if (name === "send_whatsapp") {
            const r = await bridge.sendWhatsApp({
              recipient: String(args.recipient || ""),
              message: String(args.message || ""),
            });
            confirmation = r.spoken || confirmation;
          } else if (name === "launch_app") {
            const r = await bridge.launchApp(String(args.app_name || ""));
            confirmation = r.spoken || confirmation;
          } else if (name === "play_youtube_song") {
            const r = await bridge.playYouTubeSong(String(args.song_name || ""));
            confirmation = r.spoken || confirmation;
          } else if (name === "send_message") {
            const r = await bridge.sendMessage({
              recipient: String(args.recipient || ""),
              message: String(args.message || ""),
              platform: String(args.platform || "whatsapp"),
            });
            confirmation = r.spoken || confirmation;
          } else if (name === "search_web") {
            const r = await bridge.searchWeb({
              engine: args.engine,
              query: String(args.query || ""),
            });
            confirmation = r.spoken || confirmation;
          } else if (name === "control_volume") {
            const r = await bridge.controlVolume(String(args.action || ""));
            confirmation = r.spoken || confirmation;
          } else if (name === "system_action") {
            const r = await bridge.systemAction(String(args.action || ""));
            confirmation = r.spoken || confirmation;
          } else if (name === "get_battery") {
            const r = await bridge.getBattery();
            if (r.battery) setBattery(r.battery);
            confirmation = r.spoken || confirmation;
          } else if (name === "calculate_math") {
            const r = await bridge.calculate(String(args.expression || ""));
            confirmation = r.spoken || confirmation;
          } else if (name === "get_weather") {
            const r = await bridge.getWeather(args.city ? String(args.city) : undefined);
            confirmation = r.spoken || confirmation;
          } else if (name === "get_time_date") {
            const r = await bridge.getTimeAndDate();
            confirmation = r.spoken || confirmation;
          } else if (name === "fetch_system_report") {
            const r = await bridge.getReport();
            confirmation = r.spoken || confirmation;
          } else if (name === "open_browser_url") {
            const r = await bridge.openUrl(String(args.url || ""));
            confirmation = r.spoken || confirmation;
          } else if (name === "schedule_meeting") {
            const r = await bridge.scheduleMeeting({
              title: String(args.title || ""),
              time: String(args.time || ""),
              attendees: String(args.attendees || ""),
            });
            confirmation = r.spoken || confirmation;
          }
        }

        await speak(confirmation);
      } catch (err) {
        await speak("Kuch gadbad ho gayi senpai, firse bol kar dekhiye!");
        pushLog("sys", String(err));
      } finally {
        busy.current = false;
      }
    },
    [bridge, pushLog, speak]
  );

  const speech = useSpeech(runTranscript, {
    wakeWordEnabled: true,
    onWakeWord: () => {
      pushLog("sys", "Wake word detected: AURA / Senpai recognized!");
      setMode("listening");
    },
  });

  const toggleListen = useCallback(() => {
    if (speech.listening) {
      speech.stop();
      setMode("idle");
      return;
    }
    setMode("listening");
    speech.start().catch((err) => {
      pushLog("sys", `Microphone error: ${err.message || err}`);
      setMode("idle");
    });
  }, [speech, pushLog]);

  // Auto-Arm voice listening on launch
  useEffect(() => {
    speech.start().catch(() => {});
  }, []);

  // Shortcut: Ctrl+Space to toggle microphone
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.ctrlKey) {
        e.preventDefault();
        toggleListen();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleListen]);

  useEffect(() => {
    if (speech.listening && mode !== "thinking" && mode !== "executing" && mode !== "speaking") {
      setMode("listening");
    }
  }, [speech.listening, mode]);

  const handleSaveKeys = async (newKeys: Record<string, string>) => {
    if (bridge?.saveKeys) {
      const updated = await bridge.saveKeys(newKeys);
      setKeys(updated);
      pushLog("sys", "API Keys configuration saved successfully.");
    }
  };

  const quickPills = [
    {
      label: "WHATSAPP HEER",
      icon: MessageSquare,
      cmd: "open chrome and search for whatsapp and in whatsapp send message to heer [hello heer]",
    },
    { label: "CHROME KHOLO", icon: Globe, cmd: "chrome kholo" },
    { label: "SCHEDULE MEETING", icon: Calendar, cmd: "meeting schedule karo kal 4 baje" },
    { label: "PLAY ANIME LOFI", icon: Music, cmd: "play anime lofi on youtube" },
    { label: "CALCULATOR", icon: Calculator, cmd: "calculator kholo" },
    { label: "WEATHER", icon: CloudSun, cmd: "aaj mausam kaisa hai" },
    { label: "LOCK PC", icon: Lock, cmd: "lock pc" },
    { label: "SYSTEM REPORT", icon: Zap, cmd: "system report dikhao" },
  ];

  return (
    <div className="cyber-bg mecha-grid relative flex h-full flex-col text-white select-none">
      <div className="scanlines" />

      {/* Futuristic Sci-Fi Anime Header */}
      <header className="relative z-20 flex items-center justify-between border-b border-cyan/30 bg-black/85 px-6 py-2.5 backdrop-blur-md tech-stripes">
        <div className="flex items-center gap-3">
          <div className="relative flex h-8 w-8 items-center justify-center rounded border border-cyan bg-cyan/20 shadow-[0_0_15px_#00f0ff]">
            <Sparkles className="h-4 w-4 text-cyan animate-pulse" />
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-neon animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-lg font-black tracking-[0.35em] text-white glow-text-cyan">
                AURA
              </h1>
              <span className="rounded bg-neon/15 px-2 py-0.5 text-[8px] font-mono font-bold tracking-widest text-neon border border-neon/40 shadow-neon">
                AUTONOMOUS ANIME AI
              </span>
            </div>
            <p className="text-[8px] font-mono tracking-[0.25em] text-cyan/70">
              3D COMPANION · AUTONOMOUS BACKGROUND AGENT · GROQ WHISPER V3
            </p>
          </div>
        </div>

        {/* Status Indicators & Navigation */}
        <div className="flex items-center gap-2.5 text-[9px] font-mono tracking-wider">
          {/* Avatar / Holographic Orb View Toggle */}
          <button
            type="button"
            onClick={() => setViewMode(viewMode === "avatar" ? "orb" : "avatar")}
            className="flex items-center gap-1.5 rounded border border-cyan/40 bg-cyan/10 px-2.5 py-1 text-cyan hover:border-cyan hover:bg-cyan/25 transition-all shadow-sm"
            title="Toggle between 3D Anime Avatar and Particle Hologram"
          >
            <Layers className="h-3 w-3 text-cyan" />
            <span>VIEW: {viewMode === "avatar" ? "3D ANIME" : "HOLO ORB"}</span>
          </button>

          {/* Neural Brain Indicator */}
          <span className="hidden md:inline-flex items-center gap-1.5 rounded border border-cyan/30 bg-black/60 px-2.5 py-1 text-cyan/80">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan animate-pulse" />
            BRAIN:{" "}
            <span className="font-bold text-white">
              {keys.groq
                ? "GROQ (LLAMA 3.3)"
                : keys.anthropic
                ? "CLAUDE 3.5"
                : keys.openai
                ? "GPT-4O MINI"
                : keys.gemini
                ? "GEMINI"
                : "AUTONOMOUS HEURISTIC"}
            </span>
          </span>

          {/* Background Worker Badge */}
          <span className="hidden lg:inline-flex items-center gap-1.5 rounded border border-neon/40 bg-neon/10 px-2.5 py-1 text-neon font-bold">
            <Zap className="h-3 w-3 text-neon animate-pulse" />
            BG WORKER: READY
          </span>

          {/* Autostart Toggle */}
          <button
            type="button"
            onClick={async () => {
              const next = !autostart;
              const result = await bridge?.setAutostart(next);
              setAutostart(result?.enabled ?? next);
              pushLog(
                "sys",
                (result?.enabled ?? next)
                  ? "Auto-boot armed — AURA will launch on Windows startup."
                  : "Auto-boot disarmed."
              );
            }}
            className={`rounded border px-2.5 py-1 text-[9px] font-mono font-bold tracking-widest transition-all ${
              autostart
                ? "border-neon bg-neon/20 text-neon shadow-neon"
                : "border-cyan/30 bg-black/50 text-cyan/40"
            }`}
          >
            BOOT: {autostart ? "ARMED" : "OFF"}
          </button>

          {/* Mobile Link Badge */}
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            title={`Mobile Wi-Fi IP: http://${localIp}:5173`}
            className="flex items-center gap-1.5 rounded border border-cyan/30 bg-cyan/10 px-2 py-1 text-[9px] text-cyan hover:border-cyan hover:bg-cyan/20 transition-all font-mono"
          >
            <Smartphone className="h-3 w-3" />
            <span className="hidden lg:inline">LINK:</span> {localIp}
          </button>

          {/* Help Matrix Button */}
          <button
            type="button"
            onClick={() => setIsHelpOpen(true)}
            className="rounded border border-cyan/30 bg-cyan/10 p-1.5 text-cyan hover:border-cyan hover:bg-cyan/25 transition-all shadow-sm"
            title="Commands & Shortcuts Guide"
          >
            <HelpCircle className="h-4 w-4" />
          </button>

          {/* Settings Button */}
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="rounded border border-cyan/30 bg-cyan/10 p-1.5 text-cyan hover:border-cyan hover:bg-cyan/25 transition-all shadow-sm"
            title="Settings & API Keys"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main HUD Body */}
      <main className="relative z-10 flex min-h-0 flex-1 gap-3 p-3 overflow-hidden">
        {/* Left Telemetry HUD */}
        <LeftHud
          stats={stats}
          battery={battery}
          bands={bands}
          onQuickLaunch={(cmd) => runTranscript(cmd)}
        />

        {/* Center 3D Stage: Anime Avatar VRM in Dark Neon Sci-Fi Background */}
        <section className="relative flex min-w-0 flex-1 flex-col items-center justify-center overflow-hidden rounded-lg border border-cyan/25 bg-black/70 shadow-2xl">
          {/* Subtle Sci-Fi HUD Crosshairs & Radar Marking */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-40">
            <div className="h-[460px] w-[460px] rounded-full border border-cyan/15 border-dashed animate-spin-slow" />
            <div className="absolute h-px w-[560px] bg-gradient-to-r from-transparent via-cyan/25 to-transparent" />
            <div className="absolute h-[560px] w-px bg-gradient-to-b from-transparent via-cyan/25 to-transparent" />
          </div>

          {/* 3D Scene View */}
          {viewMode === "avatar" ? (
            <VrmAvatar
              mode={mode}
              amplitude={amplitude}
              analyserNode={ttsAnalyser}
              isSpeaking={mode === "speaking"}
              modelUrl="./avatar.vrm"
            />
          ) : (
            <ParticleOrb amplitude={amplitude} mode={mode} />
          )}

          {/* Central Telemetry Status Header */}
          <div className="pointer-events-none absolute top-4 inset-x-0 flex flex-col items-center justify-center text-center z-20">
            <div className="rounded border border-cyan/40 bg-black/80 px-4 py-1.5 backdrop-blur-md shadow-lg">
              <p className="font-display text-[10px] tracking-[0.35em] text-cyan glow-text-cyan">
                AURA STATUS: {mode.toUpperCase()} · ACOUSTIC {(amplitude * 100).toFixed(0)}%
              </p>
              <div className="mt-1 flex items-center justify-center gap-3 text-[9px] font-mono text-cyan/70">
                <span className="flex items-center gap-1">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      speech.listening
                        ? "bg-neon shadow-[0_0_8px_#00ff9d] animate-pulse"
                        : "bg-cyan/40"
                    }`}
                  />
                  WAKE: "HEY AURA" / "HEY SENPAI" [ARMED]
                </span>
                <span>//</span>
                <span className="text-amber-400">SHORTCUT: CTRL+SPACE</span>
              </div>
            </div>

            {/* Live Partial Speech / Whisper v3 Transcription Readout */}
            {speech.isTranscribing ? (
              <div className="mt-3 rounded border border-purple-500 bg-black/90 px-5 py-2 shadow-2xl animate-pulse">
                <div className="flex items-center gap-2">
                  <Disc className="h-4 w-4 text-purple-400 animate-spin" />
                  <span className="text-[9px] font-mono font-bold tracking-widest text-purple-300 uppercase">
                    GROQ WHISPER V3:
                  </span>
                  <span className="text-xs font-mono font-bold text-white tracking-wide">
                    Transcribing Hindi/Hinglish speech...
                  </span>
                </div>
              </div>
            ) : speech.partial ? (
              <div className="mt-3 rounded border border-cyan bg-black/90 px-5 py-2 shadow-2xl">
                <div className="flex items-center gap-2">
                  <Disc className="h-4 w-4 text-cyan animate-spin" />
                  <span className="text-[9px] font-mono font-bold tracking-widest text-cyan uppercase">
                    RECOGNIZED:
                  </span>
                  <span className="text-xs font-mono font-bold text-white tracking-wide">
                    "{speech.partial}"
                  </span>
                </div>
              </div>
            ) : speech.listening ? (
              <div className="mt-2 text-[9px] font-mono tracking-widest text-neon/90 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-neon animate-ping" />
                LISTENING FOR HINDI / HINGLISH SPEECH... (BOLIYE SENPAI!)
              </div>
            ) : (
              <div className="mt-2 text-[9px] font-mono tracking-widest text-cyan/50">
                MICROPHONE STANDBY · CLICK "VOICE IN" OR PRESS CTRL+SPACE
              </div>
            )}
          </div>

          {/* Floating Autonomous Background Tasks HUD Widget */}
          {backgroundTasks.length > 0 && (
            <div className="absolute top-16 right-4 z-30 w-80 rounded-lg border border-neon/50 bg-black/90 p-3.5 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-neon/30 pb-2">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-neon" />
                  </span>
                  <span className="font-display text-[10px] font-bold tracking-widest text-neon glow-text-neon">
                    AURA BACKGROUND WORKER
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setBackgroundTasks((prev) => prev.filter((t) => t.status === "running"))}
                  className="rounded px-1.5 py-0.5 text-[8px] font-mono text-cyan/60 hover:text-white"
                  title="Clear finished tasks"
                >
                  CLEAR
                </button>
              </div>

              <div className="mt-2.5 space-y-2">
                {backgroundTasks.slice(0, 3).map((task) => (
                  <div key={task.id} className="rounded border border-cyan/25 bg-black/60 p-2.5 text-xs">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="font-bold text-white tracking-wide truncate max-w-[190px]">
                        {task.title}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest ${
                          task.status === "running"
                            ? "bg-neon/15 text-neon border border-neon/40 animate-pulse"
                            : task.status === "completed"
                            ? "bg-cyan/20 text-cyan border border-cyan/40"
                            : "bg-red-500/20 text-red-400 border border-red-500/40"
                        }`}
                      >
                        {task.status}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-black/70 overflow-hidden border border-cyan/20">
                      <div
                        className={`h-full transition-all duration-500 ${
                          task.status === "completed"
                            ? "bg-cyan"
                            : task.status === "failed"
                            ? "bg-red-500"
                            : "bg-gradient-to-r from-cyan via-teal-400 to-neon"
                        }`}
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>

                    {/* Current Step Description */}
                    {task.status === "running" && task.steps[task.currentStepIndex] && (
                      <p className="mt-1.5 text-[9px] font-mono text-cyan/80 truncate flex items-center gap-1">
                        <span className="animate-spin text-neon">◐</span>
                        <span>{task.steps[task.currentStepIndex].description}</span>
                      </p>
                    )}

                    {task.status === "completed" && (
                      <p className="mt-1 text-[9px] font-mono text-neon flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-neon" />
                        <span>All steps successfully executed in background!</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Floating Action Chips (OS Shortcuts & Chained Actions) */}
          <div className="absolute bottom-3 inset-x-0 flex flex-wrap items-center justify-center gap-1.5 px-4 z-20">
            {quickPills.map((pill, i) => {
              const Icon = pill.icon;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => runTranscript(pill.cmd)}
                  className="flex items-center gap-1.5 rounded border border-cyan/30 bg-black/80 px-3 py-1 text-[9px] font-mono text-cyan/90 backdrop-blur-md hover:border-cyan hover:bg-cyan/25 hover:text-white hover:scale-105 transition-all shadow-sm active:scale-95"
                >
                  <Icon className="h-3 w-3 text-cyan" />
                  <span className="tracking-wider">{pill.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Right Neural Feed HUD */}
        <RightHud
          logs={logs}
          mode={mode}
          partial={speech.partial}
          onClearLogs={() =>
            setLogs([
              {
                id: crypto.randomUUID(),
                ts: stamp(),
                kind: "sys",
                text: "Feed buffer cleared. AURA standing by, senpai! ✨",
              },
            ])
          }
        />
      </main>

      {/* Futuristic Command Bar */}
      <footer className="relative z-20 flex items-center gap-3 border-t border-cyan/30 bg-black/90 px-4 py-2.5 backdrop-blur-md tech-stripes">
        {/* Prominent Voice Transmitter Button */}
        <button
          type="button"
          onClick={toggleListen}
          className={`relative flex items-center justify-center gap-2 rounded border px-5 py-2.5 font-display text-xs tracking-[0.25em] font-bold transition-all ${
            speech.listening
              ? "border-neon bg-neon/20 text-white shadow-neon animate-pulse"
              : "border-cyan bg-cyan/15 text-cyan hover:border-cyan hover:bg-cyan/30 hover:text-white shadow-cyan"
          }`}
          title="Toggle Hindi/Hinglish Voice Input (Shortcut: Ctrl + Space)"
        >
          {speech.listening ? (
            <>
              <Mic className="h-4 w-4 text-neon animate-bounce" />
              <span className="glow-text-neon">MIC: ACTIVE</span>
            </>
          ) : (
            <>
              <MicOff className="h-4 w-4 text-cyan/70" />
              <span>VOICE IN</span>
            </>
          )}
        </button>

        {/* Terminal Input Form */}
        <form
          className="flex min-w-0 flex-1 items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const v = typed.trim();
            if (!v) return;
            setTyped("");
            runTranscript(v);
          }}
        >
          <div className="relative flex min-w-0 flex-1 items-center">
            <span className="absolute left-3 text-xs font-mono font-bold text-cyan/60 pointer-events-none">
              &gt;&gt;&gt;
            </span>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="Speak or type (e.g. 'open chrome and search for whatsapp and in whatsapp send message to heer [hello heer]')..."
              className="w-full rounded border border-cyan/30 bg-black/75 pl-10 pr-4 py-2 text-xs text-white placeholder:text-cyan/35 outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/60 transition-all font-mono"
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded border border-cyan/40 bg-cyan/15 px-5 py-2 font-display text-xs tracking-widest text-cyan hover:border-cyan hover:bg-cyan/30 hover:text-white transition-all shadow-cyan active:scale-95"
          >
            <span>TRANSMIT</span>
            <Send className="h-3 w-3" />
          </button>
        </form>
      </footer>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        keys={keys}
        onSaveKeys={handleSaveKeys}
        localIp={localIp}
      />

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        onRunCommand={(cmd) => runTranscript(cmd)}
      />
    </div>
  );
}
