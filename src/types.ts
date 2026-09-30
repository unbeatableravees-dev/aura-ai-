export type RafMode = "idle" | "listening" | "thinking" | "executing" | "speaking";
export type IrisMode = RafMode;

export type SystemStats = {
  cpu: number;
  ram: number;
  ramUsedGb: number;
  ramTotalGb: number;
  cores: number;
  hostname: string;
  platform: string;
  uptimeSec: number;
  status: string;
};

export type BatteryInfo = {
  percent: number;
  charging?: boolean;
  status?: string;
};

export type LogLine = {
  id: string;
  ts: string;
  text: string;
  kind: "sys" | "user" | "iris" | "raf" | "aura" | "tool";
};

export type ToolCall = {
  name: string;
  args: Record<string, unknown>;
};

export type InterpretResult = {
  spoken: string;
  tool: ToolCall | null;
  provider?: string;
  error?: string;
};

export type KeyStatus = {
  groq: boolean;
  openai: boolean;
  gemini: boolean;
  anthropic: boolean;
  elevenlabs: boolean;
};

export type RafAPI = {
  // Native SAPI Speech
  startNativeSpeech: () => Promise<{ ok: boolean; status: string }>;
  stopNativeSpeech: () => Promise<{ ok: boolean; status: string }>;
  getNativeSpeechStatus: () => Promise<{ isListening: boolean }>;
  onSpeechHypothesis: (cb: (text: string) => void) => () => void;
  onSpeechRecognized: (cb: (text: string) => void) => () => void;
  onSpeechReady: (cb: () => void) => () => void;
  onSpeechStopped: (cb: () => void) => () => void;

  // System & OS Tools
  getStats: () => Promise<SystemStats>;
  getReport: () => Promise<{ ok: boolean; spoken: string; report: SystemStats }>;
  openUrl: (url: string) => Promise<{ ok: boolean; spoken: string }>;
  launchApp: (appName: string) => Promise<{ ok: boolean; spoken: string; app?: string }>;
  searchWeb: (payload: { engine?: string; query: string }) => Promise<{ ok: boolean; spoken: string; url?: string }>;
  controlVolume: (action: string) => Promise<{ ok: boolean; spoken: string }>;
  systemAction: (action: string) => Promise<{ ok: boolean; spoken: string }>;
  getBattery: () => Promise<{ ok: boolean; spoken: string; battery: BatteryInfo | null }>;
  calculate: (expr: string) => Promise<{ ok: boolean; spoken: string; result?: string }>;
  getWeather: (city?: string) => Promise<{ ok: boolean; spoken: string; data?: any }>;
  playYouTubeSong: (songName: string) => Promise<{ ok: boolean; spoken: string; url?: string }>;
  sendMessage: (payload: { recipient?: string; message?: string; platform?: string }) => Promise<{ ok: boolean; spoken: string }>;
  sendWhatsApp: (payload: { recipient?: string; message?: string }) => Promise<{ ok: boolean; spoken: string; url?: string }>;
  runAutonomousTask: (payload: { title?: string; steps: any[] }) => Promise<{
    ok: boolean;
    title: string;
    stepsCount: number;
    results: any[];
    spoken: string;
  }>;
  getTimeAndDate: () => Promise<{ ok: boolean; spoken: string; time: string; date: string }>;
  scheduleMeeting: (payload: {
    title?: string;
    time?: string;
    attendees?: string;
  }) => Promise<{ ok: boolean; spoken: string }>;

  // LLM, STT, TTS
  interpret: (transcript: string) => Promise<InterpretResult>;
  transcribe: (audioBase64: string, mimeType: string) => Promise<{ text: string }>;
  speak: (text: string) => Promise<{
    ok: boolean;
    local?: boolean;
    mime?: string;
    audioBase64?: string;
  }>;
  hasKeys: () => Promise<KeyStatus>;
  saveKeys: (keys: Partial<KeyStatus>) => Promise<KeyStatus>;
  getLocalIp: () => Promise<{ ip: string }>;
  getAutostart: () => Promise<{ enabled: boolean }>;
  setAutostart: (enabled: boolean) => Promise<{ enabled: boolean }>;
};

export type IrisAPI = RafAPI;
export type AuraAPI = RafAPI;

declare global {
  interface Window {
    aura?: AuraAPI;
    raf?: RafAPI;
    iris?: RafAPI;
    webkitSpeechRecognition?: new () => SpeechRecognition;
    SpeechRecognition?: new () => SpeechRecognition;
  }

  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start: () => void;
    stop: () => void;
    abort: () => void;
    onresult: ((ev: SpeechRecognitionEvent) => void) | null;
    onerror: ((ev: any) => void) | null;
    onend: (() => void) | null;
  }

  interface SpeechRecognitionEvent extends Event {
    resultIndex: number;
    results: SpeechRecognitionResultList;
  }
}

export {};
