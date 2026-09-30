# IRIS — 3D Anime Desktop Companion

A real-time 3D Anime Desktop Companion built in **Electron**, **React**, and **Three.js** using **@pixiv/three-vrm**.

---

## Highlights & Features

1. **3D Anime Avatar Engine (`@pixiv/three-vrm`)**:
   - Loads standard humanoid VRM avatar models (`avatar.vrm`) with spring bones physics.
   - **Idle Breathing Animation**: Realistic sinusoidal breathing cycle controlling chest, spine, shoulders, and natural head drift.
   - **Natural Eye Blinking**: Automatic randomized eye blinking with realistic speed and double-blink chance.
   - **Interactive Mouse LookAt**: The companion's head and gaze smoothly track your mouse cursor across the screen.

2. **Dark Neon Sci-Fi Background**:
   - Holographic cyber pedestal with rotating neon cyan and magenta energy rings.
   - Infinite dark sci-fi neon grid floor with atmospheric fog.
   - 350+ floating cyber motes / digital dust particles drifting upwards in 3D space.
   - Cinematic cyberpunk three-point lighting (neon cyan key, neon magenta hair rim, soft peach fill).
   - Postprocessing **Bloom** effect creating vibrant neon radiance.

3. **Groq Whisper (`whisper-large-v3`) Voice Input**:
   - Ultra-accurate voice transcription optimized for **Hindi & Hinglish** (Roman and Devanagari script).
   - Integrated Web Audio Voice Activity Detection (VAD) that automatically records when you speak and transmits to Whisper v3 as soon as you pause.
   - Offline fallback to Web Speech / Windows SAPI.

4. **Friendly Anime Buddy LLM Persona**:
   - Configured as a warm, cheerful, cute anime companion ("senpai", "yaar", "arre waah!").
   - Chats casually in everyday **Hindi / Hinglish**.
   - Triggers native Windows OS shortcuts:
     - **Chrome**: Launch Chrome, open web search, or open URLs (`"Chrome kholo"`, `"Google pe search karo"`).
     - **Meetings**: Schedule Google Meet and Calendar drafts (`"Meeting schedule karo kal 4 baje"`).
     - **Applications**: Launch VS Code, Notepad, Spotify, Calculator, Terminal, Task Manager, Settings.
     - **Media & Music**: Direct YouTube song search & auto-play (`"Gana bajao"`), Volume controls (mute, up, down).
     - **System Actions**: Lock workstation, purge recycle bin, take screenshot, battery status, system telemetry report.
     - **Messaging**: WhatsApp message links.
     - **Utilities**: Live weather reports and math calculations.
   - Supports Groq (`llama-3.3-70b-versatile`), Anthropic Claude (`claude-3-5-haiku` / `claude-3-5-sonnet`), OpenAI (`gpt-4o-mini`), Google Gemini, and a robust offline Hindi/Hinglish heuristic engine that always works without API keys.

5. **ElevenLabs (`eleven_multilingual_v2`) & Real-Time Lip-Sync**:
   - Speaks back using ElevenLabs `eleven_multilingual_v2` for expressive Hindi and English pronunciation.
   - Decodes the streaming audio through Web Audio API `AudioContext` and feeds it through an `AnalyserNode`.
   - Analyzes audio frequency spectrum in real-time, mapping audio energy and frequency bands to VRM blendshapes (`aa`, `ih`, `ou`, `ee`, `oh`, and VRM 0.x visemes `A`, `I`, `U`, `E`, `O`).
   - Smoothly animates the avatar's lips in sync with speech syllables, nodding in cadence with the voice, and seamlessly closing the mouth when speech ends.

---

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment (`.env`)

Copy `.env.example` to `.env`:

```bash
copy .env.example .env
```

Set your API keys (optional — offline heuristic works without keys):

```env
GROQ_API_KEY=gsk_...
ELEVENLABS_API_KEY=xi_...
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIzaSy...
```

*Note: You can also configure all API keys directly in the app by clicking the gear icon (Settings).*

### 3. Run in Development Mode

```bash
npm run dev
```

### 4. Build and Run Production App

```bash
npm run build
npm start
```

---

## Hindi / Hinglish Voice Commands

- **Chrome Shortcut**:
  - *"Chrome kholo"*
  - *"Browser open karo"*
  - *"Google pe search karo Three.js tutorial"*
- **Meeting Shortcut**:
  - *"Meeting schedule karo project review ke liye kal 4 baje"*
  - *"Google Meet lagao"*
- **Music & Media**:
  - *"YouTube pe anime lofi gana bajao"*
  - *"Volume badhao"* / *"Volume kam karo"* / *"Mute karo"*
- **Apps & System**:
  - *"Calculator kholo"* / *"Hisaab karo 25 * 40"*
  - *"Notepad kholo"* / *"VS Code kholo"*
  - *"Lock PC"* / *"Screen lock kar do"*
  - *"Screenshot lo"*
  - *"Mausam kaisa hai"*
- **Casual Chat**:
  - *"Hey Senpai"* / *"Hey IRIS"*
  - *"Kaise ho?"*
  - *"Tum kaun ho?"*
