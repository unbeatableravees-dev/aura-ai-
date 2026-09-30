import { useState, useEffect } from "react";
import { X, Key, Shield, Smartphone, Check, Save } from "lucide-react";
import type { KeyStatus } from "../types";

export default function SettingsModal({
  isOpen,
  onClose,
  keys,
  onSaveKeys,
  localIp,
}: {
  isOpen: boolean;
  onClose: () => void;
  keys: KeyStatus;
  onSaveKeys: (newKeys: Record<string, string>) => Promise<void>;
  localIp: string;
}) {
  const [form, setForm] = useState({
    groq: "",
    anthropic: "",
    gemini: "",
    openai: "",
    elevenlabs: "",
  });
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSaveKeys(form);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="hud-panel relative w-full max-w-lg rounded-lg border border-cyan/40 bg-void-card p-6 shadow-2xl">
        <span className="hud-corner left-0 top-0 border-l-2 border-t-2" />
        <span className="hud-corner right-0 top-0 border-r-2 border-t-2" />
        <span className="hud-corner bottom-0 left-0 border-b-2 border-l-2" />
        <span className="hud-corner bottom-0 right-0 border-b-2 border-r-2" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan/20 pb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-cyan" />
            <h2 className="font-display text-base tracking-widest text-white glow-text-cyan">
              RAF CONFIGURATION
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

        <form onSubmit={handleSave} className="mt-4 space-y-4 text-xs">
          {/* Mobile Connectivity Card */}
          <div className="rounded-lg border border-neon/30 bg-neon/5 p-3">
            <div className="flex items-center gap-2 font-bold text-neon mb-1">
              <Smartphone className="h-4 w-4" />
              <span>MOBILE ACCESS LINK</span>
            </div>
            <p className="text-[11px] text-cyan/70 mb-2">
              Apne phone ke browser me ye address kholein taaki phone se RAF ko command de sakein:
            </p>
            <div className="rounded border border-neon/40 bg-black/60 px-3 py-1.5 font-mono text-neon tracking-wider select-all">
              http://{localIp}:5173
            </div>
          </div>

          {/* API Keys Configuration */}
          <div className="space-y-3">
            <p className="font-display text-[10px] tracking-[0.3em] text-cyan/60 flex items-center gap-1.5">
              <Key className="h-3.5 w-3.5 text-cyan" />
              NEURAL API UPLINKS (OPTIONAL)
            </p>

            <div>
              <div className="flex justify-between mb-1 text-[11px]">
                <span className="text-cyan/80">Groq API Key (Fast Llama 3.3 & Whisper STT)</span>
                <span className={keys.groq ? "text-neon font-bold" : "text-cyan/40"}>
                  {keys.groq ? "CONFIGURED" : "EMPTY"}
                </span>
              </div>
              <input
                type="password"
                placeholder="gsk_..."
                value={form.groq}
                onChange={(e) => setForm({ ...form, groq: e.target.value })}
                className="w-full rounded border border-cyan/25 bg-black/50 px-3 py-1.5 font-mono text-white outline-none focus:border-cyan"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1 text-[11px]">
                <span className="text-cyan/80">Anthropic Claude Key (Claude 3.5 Sonnet / Haiku)</span>
                <span className={keys.anthropic ? "text-neon font-bold" : "text-cyan/40"}>
                  {keys.anthropic ? "CONFIGURED" : "EMPTY"}
                </span>
              </div>
              <input
                type="password"
                placeholder="sk-ant-..."
                value={form.anthropic}
                onChange={(e) => setForm({ ...form, anthropic: e.target.value })}
                className="w-full rounded border border-cyan/25 bg-black/50 px-3 py-1.5 font-mono text-white outline-none focus:border-cyan"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1 text-[11px]">
                <span className="text-cyan/80">Google Gemini API Key</span>
                <span className={keys.gemini ? "text-neon font-bold" : "text-cyan/40"}>
                  {keys.gemini ? "CONFIGURED" : "EMPTY"}
                </span>
              </div>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={form.gemini}
                onChange={(e) => setForm({ ...form, gemini: e.target.value })}
                className="w-full rounded border border-cyan/25 bg-black/50 px-3 py-1.5 font-mono text-white outline-none focus:border-cyan"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1 text-[11px]">
                <span className="text-cyan/80">OpenAI API Key (GPT-4o Mini)</span>
                <span className={keys.openai ? "text-neon font-bold" : "text-cyan/40"}>
                  {keys.openai ? "CONFIGURED" : "EMPTY"}
                </span>
              </div>
              <input
                type="password"
                placeholder="sk-..."
                value={form.openai}
                onChange={(e) => setForm({ ...form, openai: e.target.value })}
                className="w-full rounded border border-cyan/25 bg-black/50 px-3 py-1.5 font-mono text-white outline-none focus:border-cyan"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1 text-[11px]">
                <span className="text-cyan/80">ElevenLabs TTS Key (eleven_multilingual_v2 + Lip-Sync)</span>
                <span className={keys.elevenlabs ? "text-neon font-bold" : "text-cyan/40"}>
                  {keys.elevenlabs ? "CONFIGURED" : "EMPTY"}
                </span>
              </div>
              <input
                type="password"
                placeholder="xi-..."
                value={form.elevenlabs}
                onChange={(e) => setForm({ ...form, elevenlabs: e.target.value })}
                className="w-full rounded border border-cyan/25 bg-black/50 px-3 py-1.5 font-mono text-white outline-none focus:border-cyan"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-cyan/20">
            <span className="text-[10px] text-cyan/50">
              *Bina keys ke bhi RAF ke sabhi local OS actions 100% chalte hain.
            </span>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 rounded border border-cyan bg-cyan/15 px-4 py-2 font-display text-xs tracking-widest text-cyan hover:bg-cyan/30 hover:text-white transition-all shadow-cyan"
            >
              {savedSuccess ? (
                <>
                  <Check className="h-4 w-4 text-neon" /> SAVED!
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> SAVE CONFIG
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
