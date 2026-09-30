import { useState, useRef, useEffect } from "react";
import { MessageSquare, Bot, User, Wrench, Info, Trash2, Copy, Check, Mic, Terminal, Radio } from "lucide-react";
import type { RafMode, LogLine } from "../types";

const MODE_CONFIG: Record<RafMode, { label: string; color: string; border: string; bg: string }> = {
  idle: { label: "STANDBY", color: "text-cyan/70", border: "border-cyan/30", bg: "bg-cyan/10" },
  listening: { label: "LISTENING [MIC ON]", color: "text-purple-300 animate-pulse", border: "border-purple-500", bg: "bg-purple-950/40" },
  thinking: { label: "COMPUTING [NEURAL]", color: "text-amber-400 animate-pulse", border: "border-amber-500", bg: "bg-amber-950/40" },
  executing: { label: "EXECUTING ACTION", color: "text-neon animate-pulse", border: "border-neon", bg: "bg-neon/15" },
  speaking: { label: "VOCAL TRANSMISSION", color: "text-sky-300 animate-pulse", border: "border-sky-400", bg: "bg-sky-950/40" },
};

export default function RightHud({
  logs,
  mode,
  partial,
  onClearLogs,
}: {
  logs: LogLine[];
  mode: RafMode;
  partial: string;
  onClearLogs?: () => void;
}) {
  const [filter, setFilter] = useState<"all" | "chat" | "tools">("all");
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, partial]);

  const filteredLogs = logs.filter((line) => {
    if (filter === "chat") return line.kind === "user" || line.kind === "iris" || line.kind === "raf" || line.kind === "aura";
    if (filter === "tools") return line.kind === "tool";
    return true;
  });

  const handleCopy = () => {
    const text = logs.map((l) => `[${l.ts}] ${l.kind.toUpperCase()}: ${l.text}`).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const status = MODE_CONFIG[mode] || MODE_CONFIG.idle;

  return (
    <aside className="hud-panel relative flex h-full w-[350px] shrink-0 flex-col p-3.5 border border-cyan/30 bg-void/90">
      {/* Sci-Fi Robotic Chassis Brackets */}
      <span className="hud-corner left-0 top-0 border-l-2 border-t-2 border-cyan" />
      <span className="hud-corner right-0 top-0 border-r-2 border-t-2 border-cyan" />
      <span className="hud-corner bottom-0 left-0 border-b-2 border-l-2 border-cyan" />
      <span className="hud-corner bottom-0 right-0 border-b-2 border-r-2 border-cyan" />

      {/* Header */}
      <header className="mb-2.5 border-b border-cyan/25 pb-2.5 flex items-center justify-between">
        <div>
          <p className="font-display text-[9px] tracking-[0.35em] text-cyan/70 flex items-center gap-1.5">
            <Radio className="h-3 w-3 text-cyan animate-pulse" />
            COMM MATRIX // R-02
          </p>
          <h2 className="mt-0.5 font-display text-xs font-bold tracking-[0.2em] text-white glow-text-cyan">
            NEURAL DATASTREAM
          </h2>
        </div>
        <div className={`rounded px-2 py-0.5 text-[8px] font-mono font-bold tracking-widest border ${status.border} ${status.color} ${status.bg} shadow-sm`}>
          {status.label}
        </div>
      </header>

      {/* Controls: Filter & Actions */}
      <div className="mb-2.5 flex items-center justify-between gap-1 text-[9px] font-mono">
        <div className="flex rounded border border-cyan/30 bg-black/60 p-0.5">
          {(["all", "chat", "tools"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`px-2 py-0.5 rounded uppercase tracking-wider transition-all ${
                filter === tab
                  ? "bg-cyan/25 text-cyan font-bold shadow-cyan border border-cyan/40"
                  : "text-cyan/40 hover:text-cyan/80"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            title="Copy Logs"
            onClick={handleCopy}
            className="rounded border border-cyan/30 bg-black/40 p-1 text-cyan/70 hover:border-cyan hover:text-cyan transition-all"
          >
            {copied ? <Check className="h-3 w-3 text-neon" /> : <Copy className="h-3 w-3" />}
          </button>
          {onClearLogs && (
            <button
              type="button"
              title="Clear Feed"
              onClick={onClearLogs}
              className="rounded border border-cyan/30 bg-black/40 p-1 text-cyan/70 hover:border-crimson hover:text-crimson transition-all"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Message Feed */}
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 text-[11px] leading-relaxed font-mono"
      >
        {filteredLogs.map((line) => {
          const isUser = line.kind === "user";
          const isTool = line.kind === "tool";
          const isAura = line.kind === "aura" || line.kind === "raf" || line.kind === "iris";

          return (
            <div
              key={line.id}
              className={`rounded p-2.5 border transition-all ${
                isUser
                  ? "border-cyan/40 bg-cyan/10 ml-3"
                  : isAura
                  ? "border-neon/40 bg-neon/10 mr-2"
                  : isTool
                  ? "border-amber/40 bg-amber/10 text-[10px]"
                  : "border-purple-500/30 bg-purple-950/25 text-purple-300"
              }`}
            >
              <div className="flex items-center justify-between mb-1 text-[8px] tracking-wider text-cyan/60">
                <span className="flex items-center gap-1.5 font-bold">
                  {isUser && <User className="h-3 w-3 text-cyan" />}
                  {isAura && <Bot className="h-3 w-3 text-neon" />}
                  {isTool && <Wrench className="h-3 w-3 text-amber" />}
                  {!isUser && !isAura && !isTool && <Info className="h-3 w-3 text-purple-400" />}
                  <span
                    className={
                      isUser
                        ? "text-cyan glow-text-cyan"
                        : isAura
                        ? "text-neon glow-text-neon"
                        : isTool
                        ? "text-amber glow-text-amber"
                        : "text-purple-300"
                    }
                  >
                    {isUser ? "OPERATOR // PILOT" : isAura ? "AURA // ANIME COMPANION" : isTool ? "EXECUTING SUB-ROUTINE" : "SYS CORE"}
                  </span>
                </span>
                <span className="font-mono text-cyan/50">{line.ts}</span>
              </div>
              <div
                className={`text-[10.5px] leading-snug ${
                  isUser
                    ? "text-white font-medium"
                    : isAura
                    ? "text-neon font-medium"
                    : isTool
                    ? "text-amber/95 font-mono break-all"
                    : "text-purple-200"
                }`}
              >
                {line.text}
              </div>
            </div>
          );
        })}

        {/* Live Audio Transcript Ticker */}
        {partial && (
          <div className="rounded border border-purple-500 bg-purple-950/50 p-2.5 text-[11px] text-purple-300 animate-pulse flex items-center gap-2 shadow-lg">
            <Mic className="h-4 w-4 text-purple-300 animate-bounce shrink-0" />
            <div className="truncate">
              <span className="text-[8px] font-bold text-purple-400 mr-1 uppercase tracking-widest">
                CAPTURING VOICE AUDIO:
              </span>
              <span className="font-semibold text-white tracking-wide font-mono">
                "{partial}"
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Robotic Diagnostic Footer Status */}
      <div className="mt-2 pt-2 border-t border-cyan/20 flex items-center justify-between text-[8px] font-mono text-cyan/50">
        <span className="flex items-center gap-1">
          <Terminal className="h-3 w-3 text-cyan" /> TERMINAL LINK
        </span>
        <span className="text-neon">PACKETS: 0 DROP</span>
      </div>
    </aside>
  );
}
