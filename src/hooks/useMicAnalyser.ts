import { useEffect, useRef, useState } from "react";

export function useMicAnalyser(active: boolean) {
  const [amplitude, setAmplitude] = useState(0);
  const [bands, setBands] = useState<number[]>(() => Array(32).fill(0));
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!active) {
      setAmplitude(0);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      return;
    }

    let ctx: AudioContext | null = null;
    let raf = 0;
    let alive = true;

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        if (!alive) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        ctx = new AudioContext();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.72;
        source.connect(analyser);
        const freq = new Uint8Array(analyser.frequencyBinCount);
        const time = new Uint8Array(analyser.fftSize);

        const tick = () => {
          analyser.getByteFrequencyData(freq);
          analyser.getByteTimeDomainData(time);
          let sum = 0;
          for (let i = 0; i < time.length; i++) {
            const v = (time[i] - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / time.length);
          setAmplitude(Math.min(1, rms * 4.2));
          const slice = Math.floor(freq.length / 32);
          const next: number[] = [];
          for (let i = 0; i < 32; i++) {
            let acc = 0;
            for (let j = 0; j < slice; j++) acc += freq[i * slice + j];
            next.push(acc / slice / 255);
          }
          setBands(next);
          raf = requestAnimationFrame(tick);
        };
        tick();
      })
      .catch(() => setAmplitude(0));

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ctx?.close();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [active]);

  return { amplitude, bands };
}
