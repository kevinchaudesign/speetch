import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx,mdx}",
    "./components/**/*.{ts,tsx,mdx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#000000",
          950: "#050505",
          900: "#0a0a0a",
        },
        bone: {
          DEFAULT: "#F5F5F7",
          50: "#FAFAFB",
          100: "#F5F5F7",
          200: "#EAEAEC",
          300: "#D1D1D5",
        },
        tech: {
          DEFAULT: "#222222",
          900: "#111111",
          800: "#1a1a1a",
          700: "#222222",
          600: "#2a2a2a",
          500: "#3a3a3a",
        },
        muted: "#6b6b70",
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        serif: [
          "var(--font-serif)",
          "ui-serif",
          "Georgia",
          "Cambria",
          "Times New Roman",
          "serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      letterSpacing: {
        tightest2: "-0.06em",
        wider2: "0.28em",
        widest2: "0.32em",
        widest3: "0.4em",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.22, 1, 0.36, 1)",
        "in-out-quart": "cubic-bezier(0.65, 0, 0.35, 1)",
        "out-quint": "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      transitionDuration: {
        "400": "400ms",
        "600": "600ms",
        "800": "800ms",
        "1200": "1200ms",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-down": {
          "0%": { opacity: "0", transform: "translateY(-8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        reveal: {
          "0%": { transform: "translateY(115%)" },
          "100%": { transform: "translateY(0%)" },
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "ping-soft": {
          "0%": { transform: "scale(1)", opacity: "1" },
          "75%, 100%": { transform: "scale(2)", opacity: "0" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "fade-up": "fade-up 1s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "fade-down": "fade-down 1s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        reveal: "reveal 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        marquee: "marquee 30s linear infinite",
        "ping-soft": "ping-soft 2s cubic-bezier(0, 0, 0.2, 1) infinite",
      },
      backgroundImage: {
        "hairline-x":
          "linear-gradient(to right, transparent, rgba(245,245,247,0.08), transparent)",
        "hairline-y":
          "linear-gradient(to bottom, transparent, rgba(245,245,247,0.08), transparent)",
        vignette:
          "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.55) 100%)",
      },
      boxShadow: {
        glow: "0 0 40px rgba(245, 245, 247, 0.06)",
      },
    },
  },
  plugins: [typography],
};

export default config;
