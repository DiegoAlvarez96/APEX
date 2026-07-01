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
        mist: "rgba(255, 255, 255, 0.08)",
        graphite: "#101114",
        limeglass: "#d8ff64",
        coral: "#ff6f61",
        aqua: "#5eead4"
      },
      boxShadow: {
        glow: "0 18px 70px rgba(216, 255, 100, 0.12)",
        panel: "0 20px 80px rgba(0, 0, 0, 0.22)"
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Inter", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
