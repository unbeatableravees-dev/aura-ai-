import { Cpu, HardDrive, Terminal, Battery, Radio, Globe, Video, FileText, Calculator, Code, ShieldCheck, Zap } from "lucide-react";
import type { SystemStats, BatteryInfo } from "../types";

function RoboticMeter({
  label,
  value,
  colorClass = "from-cyan via-teal-400 to-neon",
}: {
  label: string;
  value: number;
  colorClass?: string;
}) {
  const safeVal = Math.min(100, Math.max(0, value));
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[9px] font-mono tracking-widest text-cyan/70">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_6px_#00f0ff] animate-pulse" />
          {label}
        </span>
        <span className="font-bold text-cyan glow-text-cyan">{safeVal.toFixed(1)}%</span>
      </div>
      <div className="relative h-2.5 w-full rounded-sm bg-black/60 p-0.5 border border-cyan/30 shadow-inner">
        {/* Robotic Grid Ticks Overlay */}
        <div className="absolute inset-0 z-10 flex justify-between px-1 pointer-events-none opacity-30">
          <span className="w-px h-full bg-cyan" />
          <span className="w-px h-full bg-cyan" />
          <span className="w-px h-full bg-cyan" />
          <span className="w-px h-full bg-cyan" />
        </div>
        <div
          className={`h-full rounded-sm bg-gradient-to-r ${colorClass} shadow-cyan transition-all duration-300`}
          style={{ width: `${safeVal}%` }}
        />
      </div>
    </div>
  );
}

export default function LeftHud({
  stats,
  battery,
  bands,
  onQuickLaunch,
}: {
  stats: SystemStats | null;
  battery?: BatteryInfo | null;
  bands: number[];
  onQuickLaunch?: (app: string) => void;
}) {
  const quickApps = [
    { id: "calc", name: "CALCULATOR", icon: Calculator, cmd: "open calculator" },
    { id: "notepad", name: "NOTEPAD", icon: FileText, cmd: "open notepad" },
    { id: "chrome", name: "CHROME", icon: Globe, cmd: "open chrome" },
    { id: "youtube", name: "YOUTUBE", icon: Video, cmd: "open youtube" },
    { id: "code", name: "VS CODE", icon: Code, cmd: "open vs code" },
    { id: "cmd", name: "TERMINAL", icon: Terminal, cmd: "open terminal" },
  ];

  return (
    <aside className="hud-panel relative flex h-full w-[290px] shrink-0 flex-col gap-3.5 p-3.5 overflow-y-auto border border-cyan/30 bg-void/90">
      {/* Sci-Fi Robotic Chassis Brackets */}
      <span className="hud-corner left-0 top-0 border-l-2 border-t-2 border-cyan" />
      <span className="hud-corner right-0 top-0 border-r-2 border-t-2 border-cyan" />
      <span className="hud-corner bottom-0 left-0 border-b-2 border-l-2 border-cyan" />
      <span className="hud-corner bottom-0 right-0 border-b-2 border-r-2 border-cyan" />

      {/* Industrial Header Plate */}
      <header className="border-b border-cyan/25 pb-2.5">
        <div className="flex items-center justify-between">
          <p className="font-display text-[9px] tracking-[0.35em] text-cyan/70 flex items-center gap-1.5">
            <Radio className="h-3 w-3 text-cyan animate-pulse" />
            CHASSIS // MK-IV
          </p>
          <span className="rounded bg-neon/15 px-2 py-0.5 text-[8px] font-mono font-bold tracking-widest text-neon border border-neon/40 shadow-neon">
            {stats?.status ?? "ONLINE"}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <h2 className="font-display text-xs font-bold tracking-[0.2em] text-white glow-text-cyan">
            TELEMETRY MATRIX
          </h2>
          <span className="text-[8px] font-mono text-cyan/50 tracking-widest">SUB-SYS: ARM</span>
        </div>
      </header>

      {/* Core Robotic Processing Gauges */}
      <div className="space-y-3 rounded border border-cyan/25 bg-black/60 p-3 tech-stripes">
        <div className="flex items-center justify-between text-[9px] font-mono tracking-widest text-cyan/80 pb-1 border-b border-cyan/15">
          <span className="flex items-center gap-1">
            <Zap className="h-3 w-3 text-amber" /> POWER REAGENTS
          </span>
          <span className="text-neon font-bold">2.4 GHz</span>
        </div>
        <RoboticMeter label="CPU CORE LOAD" value={stats?.cpu ?? 0} colorClass="from-cyan via-blue-500 to-indigo-500" />
        <RoboticMeter label="RAM SYNAPSE ALLOCATION" value={stats?.ram ?? 0} colorClass="from-cyan via-teal-400 to-neon" />
        
        <div className="flex justify-between text-[9px] font-mono text-cyan/70 pt-1 border-t border-cyan/15">
          <span>ALLOCATED MEM:</span>
          <span className="text-white font-bold tracking-wider">
            {stats ? `${stats.ramUsedGb} / ${stats.ramTotalGb} GB` : "READING..."}
          </span>
        </div>
      </div>

      {/* Hardware Node Telemetry Matrix */}
      <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
        <div className="rounded border border-cyan/25 bg-black/50 p-2 shadow-sm">
          <div className="text-cyan/60 flex items-center gap-1">
            <Cpu className="h-3 w-3 text-cyan" /> CORES
          </div>
          <div className="mt-1 font-bold text-white text-[10px]">{stats?.cores ?? "—"} PARALLEL</div>
        </div>

        <div className="rounded border border-cyan/25 bg-black/50 p-2 shadow-sm">
          <div className="text-cyan/60 flex items-center gap-1">
            <Battery className="h-3 w-3 text-neon" /> POWER CELL
          </div>
          <div className="mt-1 font-bold text-neon text-[10px]">
            {battery ? `${battery.percent}% [${battery.status || "OK"}]` : "DIRECT AC 220V"}
          </div>
        </div>

        <div className="col-span-2 rounded border border-cyan/25 bg-black/50 p-2 shadow-sm">
          <div className="text-cyan/60 flex items-center gap-1">
            <HardDrive className="h-3 w-3 text-cyan" /> HOST NODE IDENTIFIER
          </div>
          <div className="mt-1 truncate font-bold text-cyan text-[10px] tracking-wider">
            {stats?.hostname ? `${stats.hostname.toUpperCase()} // ACTIVE` : "RESOLVING HOST..."}
          </div>
        </div>
      </div>

      {/* Mechanical Dock Actions */}
      <div className="rounded border border-cyan/25 bg-black/60 p-2.5">
        <p className="mb-2 text-[8px] font-mono tracking-[0.3em] text-cyan/70 flex items-center gap-1">
          <ShieldCheck className="h-3 w-3 text-cyan" /> RAPID COMMAND INTERFACE
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {quickApps.map((app) => {
            const Icon = app.icon;
            return (
              <button
                key={app.id}
                type="button"
                onClick={() => onQuickLaunch?.(app.cmd)}
                className="flex flex-col items-center justify-center rounded border border-cyan/25 bg-cyan/10 p-1.5 text-[8px] font-mono text-cyan hover:border-cyan hover:bg-cyan/30 hover:text-white transition-all shadow-sm group active:scale-95"
              >
                <Icon className="h-3.5 w-3.5 mb-1 text-cyan group-hover:scale-110 group-hover:text-neon transition-all" />
                <span className="truncate w-full text-center tracking-wider">{app.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Real-time Acoustic Waveform Equalizer */}
      <div className="mt-auto rounded border border-cyan/25 bg-black/70 p-2.5">
        <div className="mb-1.5 flex items-center justify-between text-[8px] font-mono tracking-[0.25em] text-cyan/70">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan animate-ping" />
            ACOUSTIC RADAR
          </span>
          <span className="text-neon font-bold tracking-widest">ONLINE</span>
        </div>
        <div className="flex h-11 items-end gap-1 px-1 bg-black/40 rounded border border-cyan/10">
          {bands.map((b, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-xs bg-gradient-to-t from-cyan/40 via-cyan to-neon shadow-[0_0_8px_#00f0ff] transition-all duration-75"
              style={{
                height: `${Math.max(10, b * 100)}%`,
                opacity: 0.45 + b * 0.55,
              }}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}
