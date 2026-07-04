import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#f8fafc",
        mist: "rgb(var(--surface))",
        graphite: "#101114",
        limeglass: "rgb(var(--accent))",
        coral: "rgb(var(--danger))",
        aqua: "rgb(var(--accent-2))"
      },
      boxShadow: {
        glow: "0 18px 70px rgba(216, 255, 100, 0.10)",
        panel: "0 24px 80px rgba(0, 0, 0, 0.28)",
        soft: "0 12px 34px rgba(0, 0, 0, 0.12)",
        action: "0 16px 34px rgba(216, 255, 100, 0.22)"
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Inter", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
