import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          DEFAULT: "#080705",
          2: "#12100e",
          3: "#1c1915",
          4: "#272320",
        },
        gold: {
          DEFAULT: "#c9a84c",
          light: "#e8d5a0",
          dim: "#7a6530",
          pale: "#f5edd6",
        },
        cream: {
          DEFAULT: "#f0e6d0",
          dim: "#a89880",
          muted: "#6b5e4e",
        },
        border: {
          DEFAULT: "#2c261e",
          gold: "#3d3420",
        },
      },
      fontFamily: {
        serif: ["var(--font-cormorant)", "Garamond", "serif"],
        sans: ["var(--font-jost)", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-xl": ["clamp(5rem, 14vw, 12rem)", { lineHeight: "0.9", letterSpacing: "-0.02em" }],
        "display-lg": ["clamp(3rem, 8vw, 7rem)", { lineHeight: "0.95", letterSpacing: "-0.01em" }],
        "display-md": ["clamp(2rem, 5vw, 4rem)", { lineHeight: "1", letterSpacing: "0" }],
      },
      animation: {
        "fade-in": "fadeIn 0.8s ease-out forwards",
        "slide-up": "slideUp 0.6s ease-out forwards",
        "cursor-blink": "cursorBlink 1s step-end infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        cursorBlink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
      },
      backgroundImage: {
        "noise": "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};

export default config;
