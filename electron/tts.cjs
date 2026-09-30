const { execFile } = require("child_process");

async function elevenLabs(text) {
  const key = process.env.ELEVENLABS_API_KEY;
  // Default to Rachel (sweet, clear female voice) or user-defined voice
  const voice = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voice}/stream`,
    {
      method: "POST",
      headers: {
        "xi-api-key": key,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.8,
          style: 0.25,
          use_speaker_boost: true,
        },
      }),
    }
  );
  if (!res.ok) throw new Error(await res.text());
  const buf = Buffer.from(await res.arrayBuffer());
  return { mime: "audio/mpeg", audioBase64: buf.toString("base64") };
}

function edgeTts(text) {
  return new Promise((resolve) => {
    const escaped = String(text).replace(/'/g, "''");
    const ps = `
Add-Type -AssemblyName System.Speech
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$s.Rate = 1
$s.Speak('${escaped}')
`;
    execFile(
      "powershell.exe",
      ["-NoProfile", "-Command", ps],
      { windowsHide: true },
      (err) => {
        if (err) resolve({ ok: false, local: true, error: String(err) });
        else resolve({ ok: true, local: true });
      }
    );
  });
}

async function speak(text) {
  const line = String(text || "").trim();
  if (!line) return { ok: false };
  if (process.env.ELEVENLABS_API_KEY) {
    try {
      const audio = await elevenLabs(line);
      return { ok: true, ...audio };
    } catch (err) {
      const local = await edgeTts(line);
      return { ...local, fallback: "sapi", error: String(err.message || err) };
    }
  }
  return edgeTts(line);
}

module.exports = { speak };
