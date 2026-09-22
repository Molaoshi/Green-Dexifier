import type { Config } from "tailwindcss";

// Brand tokens mirror apps/web — single visual language across products.
const config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#13F187",
        "primary-dark": "#0FBD6B",
        abyss: "#030a06",
        accent: "#00e0a0",
        error: "#f44336",
        warning: "#f5b524",
      },
      boxShadow: {
        "neon-sm": "0 0 12px rgba(19,241,135,0.25)",
        neon: "0 0 24px rgba(19,241,135,0.35)",
        card: "0 12px 48px rgba(0,0,0,0.55)",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 18px rgba(19,241,135,0.22)" },
          "50%": { boxShadow: "0 0 36px rgba(19,241,135,0.48)" },
        },
      },
      animation: {
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;

export default config;
