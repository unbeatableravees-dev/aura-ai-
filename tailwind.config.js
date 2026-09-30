/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#060913",
        "void-card": "rgba(10, 16, 30, 0.78)",
        cyan: {
          DEFAULT: "#00f0ff",
          dim: "#008899",
          glow: "rgba(0, 240, 255, 0.4)",
        },
        neon: {
          DEFAULT: "#00ff9d",
          dim: "#008855",
          glow: "rgba(0, 255, 157, 0.35)",
        },
        violet: {
          DEFAULT: "#8b5cf6",
          dim: "#5b21b6",
          glow: "rgba(139, 92, 246, 0.35)",
        },
        amber: {
          DEFAULT: "#ffb800",
          dim: "#b45309",
          glow: "rgba(255, 184, 0, 0.35)",
        },
        crimson: {
          DEFAULT: "#ff0055",
          glow: "rgba(255, 0, 85, 0.4)",
        },
      },
      fontFamily: {
        hud: ['"Share Tech Mono"', "ui-monospace", "monospace"],
        display: ['"Orbitron"', "sans-serif"],
      },
      boxShadow: {
        cyan: "0 0 20px rgba(0, 240, 255, 0.35)",
        neon: "0 0 20px rgba(0, 255, 157, 0.35)",
        violet: "0 0 20px rgba(139, 92, 246, 0.35)",
        amber: "0 0 20px rgba(255, 184, 0, 0.35)",
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 20s linear infinite",
        "reverse-spin": "reverse-spin 25s linear infinite",
      },
      keyframes: {
        "reverse-spin": {
          from: { transform: "rotate(360deg)" },
          to: { transform: "rotate(0deg)" },
        },
      },
    },
  },
  plugins: [],
};
