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
        solar: {
          dark: "#062B21",
          deep: "#0B4D3C",
          DEFAULT: "#0D5C46",
          emerald: "#137A5D",
          light: "#E6F4F0",
          subtle: "#F0F9F6",
        },
        sun: {
          dark: "#D97706",
          DEFAULT: "#F59E0B",
          warm: "#EAB308",
          amber: "#FBBF24",
          light: "#FEF3C7",
          glow: "#FFFBEB",
        },
        charcoal: {
          900: "#0F172A",
          800: "#1E293B",
          700: "#334155",
          600: "#475569",
          500: "#64748B",
          100: "#F1F5F9",
          50: "#F8FAFC",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
        heading: ["var(--font-outfit)", "Outfit", "sans-serif"],
      },
      boxShadow: {
        premium: "0 10px 30px -5px rgba(11, 77, 60, 0.08), 0 4px 12px -2px rgba(11, 77, 60, 0.04)",
        "premium-hover": "0 20px 40px -10px rgba(11, 77, 60, 0.16), 0 8px 16px -4px rgba(11, 77, 60, 0.08)",
        sun: "0 10px 25px -5px rgba(245, 158, 11, 0.3)",
      },
      animation: {
        "float-slow": "float 6s ease-in-out infinite",
        "pulse-subtle": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
