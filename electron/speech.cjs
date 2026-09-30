const { spawn } = require("child_process");
const EventEmitter = require("events");

class SpeechService extends EventEmitter {
  constructor() {
    super();
    this.process = null;
    this.isListening = false;
  }

  start() {
    if (this.process) return { ok: true, status: "already_running" };

    const psScript = `
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Speech

$source = @"
using System;
using System.Globalization;
using System.Speech.Recognition;

public class SpeechBridge {
    private static SpeechRecognitionEngine engine;

    public static void Run() {
        try {
            var recognizers = SpeechRecognitionEngine.InstalledRecognizers();
            if (recognizers.Count == 0) {
                Console.WriteLine("ERROR:No speech recognizers installed on this Windows system.");
                return;
            }
            RecognizerInfo selected = null;
            foreach (var r in recognizers) {
                if (r.Culture.Name.StartsWith("en", StringComparison.OrdinalIgnoreCase)) {
                    selected = r;
                    break;
                }
            }
            if (selected == null) selected = recognizers[0];

            engine = new SpeechRecognitionEngine(selected.Id);
            Grammar grammar = new DictationGrammar();
            engine.LoadGrammar(grammar);
            engine.SetInputToDefaultAudioDevice();

            engine.SpeechHypothesized += (s, e) => {
                if (e.Result != null && !string.IsNullOrWhiteSpace(e.Result.Text)) {
                    Console.WriteLine("HYP:" + e.Result.Text);
                }
            };

            engine.SpeechRecognized += (s, e) => {
                if (e.Result != null && e.Result.Confidence >= 0.10) {
                    Console.WriteLine("REC:" + e.Result.Text);
                }
            };

            Console.WriteLine("STATUS:READY");
            engine.RecognizeAsync(RecognizeMode.Multiple);

            while (true) {
                string line = Console.ReadLine();
                if (line == null || line.Trim() == "STOP") {
                    break;
                }
            }
        } catch (Exception ex) {
            Console.WriteLine("ERROR:" + ex.Message);
        } finally {
            if (engine != null) {
                try {
                    engine.RecognizeAsyncStop();
                    engine.Dispose();
                } catch {}
            }
            Console.WriteLine("STATUS:STOPPED");
        }
    }
}
"@

Add-Type -TypeDefinition $source -ReferencedAssemblies "System.Speech"
[SpeechBridge]::Run()
`;

    this.process = spawn("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", psScript], {
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
    });

    this.isListening = true;

    this.process.stdout.on("data", (data) => {
      const lines = data.toString("utf8").split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (trimmed.startsWith("HYP:")) {
          const hypText = trimmed.slice(4).trim();
          this.emit("hypothesis", hypText);
        } else if (trimmed.startsWith("REC:")) {
          const recText = trimmed.slice(4).trim();
          this.emit("recognized", recText);
        } else if (trimmed.startsWith("STATUS:READY")) {
          this.emit("ready");
        } else if (trimmed.startsWith("ERROR:")) {
          this.emit("error", trimmed.slice(6));
        }
      }
    });

    this.process.stderr.on("data", () => {
      // non-fatal host noise
    });

    this.process.on("close", () => {
      this.process = null;
      this.isListening = false;
      this.emit("stopped");
    });

    return { ok: true, status: "listening" };
  }

  stop() {
    if (this.process) {
      try {
        this.process.stdin.write("STOP\n");
        setTimeout(() => {
          if (this.process) {
            this.process.kill();
            this.process = null;
          }
        }, 400);
      } catch {
        if (this.process) this.process.kill();
        this.process = null;
      }
    }
    this.isListening = false;
    return { ok: true, status: "stopped" };
  }

  getStatus() {
    return { isListening: this.isListening };
  }
}

module.exports = new SpeechService();
