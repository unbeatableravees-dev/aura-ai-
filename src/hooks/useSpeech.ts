import { useCallback, useEffect, useRef, useState } from "react";

function playRoboticChime(type: "wake" | "ready" | "ack") {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === "wake") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === "ready") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.08);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.start(now);
      osc.stop(now + 0.16);
    } else {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(783.99, now);
      osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.08);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.18);
    }
    setTimeout(() => ctx.close().catch(() => {}), 300);
  } catch {}
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function useSpeech(
  onFinal: (text: string) => void,
  options?: {
    wakeWordEnabled?: boolean;
    onWakeWord?: () => void;
  }
) {
  const [listening, setListening] = useState(false);
  const [partial, setPartial] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [wakeDetected, setWakeDetected] = useState(false);

  const onFinalRef = useRef(onFinal);
  onFinalRef.current = onFinal;

  const onWakeRef = useRef(options?.onWakeWord);
  onWakeRef.current = options?.onWakeWord;

  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const isSpeakingSpeechRef = useRef(false);
  const silenceStartRef = useRef(0);
  const speechStartRef = useRef(0);
  const isStoppingForTranscription = useRef(false);
  const lastProcessedRef = useRef({ text: "", time: 0 });

  // Process finalized transcript with wake word stripping & deduplication
  const processTranscript = useCallback((raw: string) => {
    const text = raw.trim();
    if (!text) return;

    // Deduplication check: ignore if exact same text within 1.5 seconds
    const now = Date.now();
    if (
      lastProcessedRef.current.text.toLowerCase() === text.toLowerCase() &&
      now - lastProcessedRef.current.time < 1500
    ) {
      return;
    }
    lastProcessedRef.current = { text, time: now };

    playRoboticChime("ack");

    // Anime buddy wake words: iris, raf, senpai, buddy, suno
    const wakeRegex = /^(?:hey|hi|hello|ok|suno)?\s*(?:iris|raf|buddy|senpai)\b/i;
    if (wakeRegex.test(text)) {
      setWakeDetected(true);
      playRoboticChime("wake");
      onWakeRef.current?.();
      setTimeout(() => setWakeDetected(false), 2000);

      const command = text.replace(wakeRegex, "").trim();
      if (command.length > 0) {
        onFinalRef.current(command);
      }
    } else {
      onFinalRef.current(text);
    }
  }, []);

  const stop = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }

    if (mediaRecRef.current && mediaRecRef.current.state !== "inactive") {
      try {
        mediaRecRef.current.stop();
      } catch {}
      mediaRecRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    const bridge = window.raf || window.iris;
    if (bridge?.stopNativeSpeech) {
      bridge.stopNativeSpeech().catch(() => {});
    }

    setListening(false);
    setIsTranscribing(false);
    setPartial("");
    isSpeakingSpeechRef.current = false;
    isStoppingForTranscription.current = false;
  }, []);

  const start = useCallback(async () => {
    stop();
    setPartial("");

    const bridge = window.raf || window.iris;

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn("navigator.mediaDevices not available");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtxClass();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);

      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";

      const createRecorder = () => {
        const rec = new MediaRecorder(stream, { mimeType: mime });
        audioChunksRef.current = [];

        rec.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        rec.onstop = async () => {
          const blob = new Blob(audioChunksRef.current, { type: mime });
          audioChunksRef.current = [];

          if (bridge?.transcribe && blob.size > 1400 && isSpeakingSpeechRef.current) {
            setIsTranscribing(true);
            setPartial("Groq Whisper v3 transcribing...");
            try {
              const b64 = await blobToBase64(blob);
              const result = await bridge.transcribe(b64, mime);
              if (result && result.text && result.text.trim().length > 0) {
                setPartial(result.text.trim());
                processTranscript(result.text.trim());
              }
            } catch (err) {
              console.warn("Groq Whisper STT transcription error:", err);
            } finally {
              setIsTranscribing(false);
              setPartial("");
            }
          }

          isSpeakingSpeechRef.current = false;
          isStoppingForTranscription.current = false;

          // Restart MediaRecorder for continuous Hindi/Hinglish speech detection
          if (streamRef.current?.active) {
            try {
              createRecorder();
            } catch {}
          }
        };

        mediaRecRef.current = rec;
        rec.start(100); // 100ms timeslice for steady chunk streaming
      };

      createRecorder();
      setListening(true);
      playRoboticChime("ready");

      // Real-time Voice Activity Detection (VAD) via Web Audio Analyser
      const buffer = new Uint8Array(analyser.frequencyBinCount);
      const speechThreshold = 18; // amplitude threshold for speech detection
      const silenceDurationMs = 800; // milliseconds of silence to trigger transcription

      const checkVad = () => {
        if (!analyser || !streamRef.current?.active) return;
        analyser.getByteFrequencyData(buffer);

        let sum = 0;
        for (let i = 0; i < buffer.length; i++) sum += buffer[i];
        const avg = sum / buffer.length;

        const now = Date.now();

        if (avg > speechThreshold) {
          if (!isSpeakingSpeechRef.current) {
            isSpeakingSpeechRef.current = true;
            speechStartRef.current = now;
          }
          silenceStartRef.current = 0;
        } else if (isSpeakingSpeechRef.current) {
          if (silenceStartRef.current === 0) {
            silenceStartRef.current = now;
          } else if (
            now - silenceStartRef.current > silenceDurationMs &&
            now - speechStartRef.current > 400 &&
            !isStoppingForTranscription.current
          ) {
            // User finished speaking phrase! Stop recorder to send to Groq Whisper v3
            isStoppingForTranscription.current = true;
            if (mediaRecRef.current && mediaRecRef.current.state === "recording") {
              try {
                mediaRecRef.current.stop();
              } catch {}
            }
          }
        }

        animFrameRef.current = requestAnimationFrame(checkVad);
      };

      animFrameRef.current = requestAnimationFrame(checkVad);
    } catch (err: any) {
      console.warn("Microphone start failed:", err);
      // Fallback: connect native SAPI speech if available
      if (bridge?.startNativeSpeech) {
        bridge.startNativeSpeech().then(() => setListening(true)).catch(() => {});
      }
    }
  }, [stop, processTranscript]);

  // Connect native Electron SAPI listeners as fallback
  useEffect(() => {
    const bridge = window.raf || window.iris;
    if (!bridge || !bridge.onSpeechRecognized) return;

    const unsubHyp = bridge.onSpeechHypothesis?.((text: string) => {
      setPartial(text);
    });

    const unsubRec = bridge.onSpeechRecognized?.((text: string) => {
      setPartial("");
      processTranscript(text);
    });

    const unsubStopped = bridge.onSpeechStopped?.(() => {
      setListening(false);
    });

    return () => {
      unsubHyp?.();
      unsubRec?.();
      unsubStopped?.();
    };
  }, [processTranscript]);

  return {
    listening,
    partial,
    isTranscribing,
    wakeDetected,
    start,
    stop,
  };
}
