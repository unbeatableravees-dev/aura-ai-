import { X, Mic, Terminal, Sparkles, Volume2, Lock, Sun, Search, Calculator, Play, Cpu } from "lucide-react";

export default function HelpModal({
  isOpen,
  onClose,
  onRunCommand,
}: {
  isOpen: boolean;
  onClose: () => void;
  onRunCommand: (cmd: string) => void;
}) {
  if (!isOpen) return null;

  const categories = [
    {
      title: "Autonomous Multi-Step Workflows (Chained)",
      icon: Cpu,
      color: "text-neon",
      items: [
        {
          label: "WhatsApp Chained Flow",
          en: "Open Chrome, search WhatsApp & send message",
          hi: "Chrome kholo, WhatsApp search karo aur Heer ko 'hello heer' bhejo",
          cmd: "open chrome and search for whatsapp and in whatsapp send message to heer [hello heer]",
        },
        {
          label: "Background Execution",
          en: "Execute workflow in background autonomously",
          hi: "Background me khud ye saare kaam execute karo",
          cmd: "background me open chrome and search for whatsapp and send message to heer [hello heer]",
        },
        {
          label: "Direct WhatsApp",
          en: "Send message to Heer on WhatsApp",
          hi: "Heer ko WhatsApp par message bhejo",
          cmd: "send message to heer [hello heer] on whatsapp",
        },
      ],
    },
    {
      title: "Voice Wake Word & Anime Companion",
      icon: Mic,
      color: "text-purple-400",
      items: [
        { label: "Wake Word", en: "Hey AURA / Hey Senpai", hi: "Suno AURA / Hey Senpai", cmd: "Hey AURA" },
        { label: "Identity", en: "Who are you?", hi: "Tum kaun ho?", cmd: "Tum kaun ho" },
        { label: "Casual Chat", en: "How are you?", hi: "Kaise ho senpai?", cmd: "Kaise ho" },
      ],
    },
    {
      title: "App Launcher & OS Shortcuts",
      icon: Terminal,
      color: "text-cyan",
      items: [
        { label: "Chrome Browser", en: "Open Chrome", hi: "Chrome browser kholo", cmd: "chrome kholo" },
        { label: "Schedule Meeting", en: "Schedule Google Meet", hi: "Meeting schedule karo kal 4 baje", cmd: "meeting schedule karo kal 4 baje" },
        { label: "Calculator", en: "Open Calculator", hi: "Calculator chalao", cmd: "open calculator" },
        { label: "VS Code", en: "Open VS Code", hi: "Code editor open karo", cmd: "open vs code" },
        { label: "Notepad", en: "Open Notepad", hi: "Notepad kholo", cmd: "open notepad" },
      ],
    },
    {
      title: "Media & Audio Controls",
      icon: Volume2,
      color: "text-neon",
      items: [
        { label: "Volume Up", en: "Volume up", hi: "Aawaz badhao", cmd: "volume up" },
        { label: "Volume Down", en: "Volume down", hi: "Aawaz kam karo", cmd: "volume down" },
        { label: "Mute", en: "Mute audio", hi: "Aawaz band karo", cmd: "mute" },
        { label: "Play/Pause", en: "Toggle media play pause", hi: "Gaana roko", cmd: "pause media" },
      ],
    },
    {
      title: "Web & YouTube Search",
      icon: Search,
      color: "text-sky-400",
      items: [
        { label: "YouTube Play", en: "Play Lo-Fi on YouTube", hi: "YouTube pe gaane chalao", cmd: "play lofi on youtube" },
        { label: "Google Search", en: "Search quantum computing on Google", hi: "Google pe search karo latest AI news", cmd: "search latest AI news on google" },
      ],
    },
    {
      title: "System & Security",
      icon: Lock,
      color: "text-amber",
      items: [
        { label: "Lock PC", en: "Lock PC / workstation", hi: "Screen lock kar do", cmd: "lock pc" },
        { label: "Empty Trash", en: "Empty Recycle Bin", hi: "Kachra saaf karo", cmd: "empty recycle bin" },
        { label: "Telemetry", en: "System report", hi: "CPU RAM status dikhao", cmd: "system report" },
        { label: "Battery", en: "Battery status", hi: "Battery kitni hai", cmd: "battery status" },
        { label: "Screenshot", en: "Take screenshot", hi: "Screenshot lo", cmd: "take screenshot" },
      ],
    },
    {
      title: "Smart Math & Weather",
      icon: Calculator,
      color: "text-emerald-400",
      items: [
        { label: "Calculation", en: "Calculate 450 * 18 + 120", hi: "Hisaab karo 50 * 20", cmd: "calculate 450 * 18 + 120" },
        { label: "Percentage", en: "What is 15 percent of 850", hi: "15% of 850", cmd: "what is 15 percent of 850" },
        { label: "Weather", en: "Weather in Delhi", hi: "Mumbai ka mausam kaisa hai", cmd: "weather in Delhi" },
        { label: "Time", en: "What is the time?", hi: "Kya time hua hai?", cmd: "what is the time" },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="hud-panel relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-lg border border-cyan/40 bg-void-card p-6 shadow-2xl">
        <span className="hud-corner left-0 top-0 border-l-2 border-t-2" />
        <span className="hud-corner right-0 top-0 border-r-2 border-t-2" />
        <span className="hud-corner bottom-0 left-0 border-b-2 border-l-2" />
        <span className="hud-corner bottom-0 right-0 border-b-2 border-r-2" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan/20 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-cyan animate-pulse" />
            <h2 className="font-display text-base tracking-widest text-white glow-text-cyan">
              AURA COMMAND MATRIX (AUTONOMOUS & MULTI-STEP)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-cyan/60 hover:bg-cyan/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-2 text-xs text-cyan/70">
          Aap mic on karke muh se bol sakte hain ya niche diye gaye kisi bhi command chip par click karke turant test kar sakte hain:
        </p>

        {/* Category List */}
        <div className="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div key={idx} className="rounded-lg border border-cyan/20 bg-black/40 p-3">
                <div className={`flex items-center gap-2 font-display text-xs tracking-wider ${cat.color} mb-2`}>
                  <Icon className="h-4 w-4" />
                  <span>{cat.title.toUpperCase()}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {cat.items.map((item, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        onRunCommand(item.cmd);
                        onClose();
                      }}
                      className="flex items-center justify-between rounded border border-cyan/20 bg-cyan/5 p-2 text-left hover:border-cyan hover:bg-cyan/20 transition-all group"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-semibold text-white text-[11px] group-hover:text-cyan">
                          {item.en}
                        </div>
                        <div className="text-[10px] text-cyan/60 italic truncate">
                          "{item.hi}"
                        </div>
                      </div>
                      <Play className="h-3.5 w-3.5 text-cyan shrink-0 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-cyan/20 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-cyan/40 bg-cyan/10 px-4 py-1.5 font-display text-xs tracking-widest text-cyan hover:bg-cyan/30"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
