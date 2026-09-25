import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: {
          50: "#18181b",
          100: "#27272a",
          200: "#3f3f46",
          300: "#52525b",
          800: "#09090b",
          900: "#040405",
        },
        btc: {
          gold: "#F7931A",
          dark: "#1A1715",
          accent: "#FF9900",
        },
        signal: {
          long: "#10b981",
          short: "#ef4444",
          wait: "#f59e0b",
        }
      },
    },
  },
  plugins: [],
};

export default config;
