/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./providers/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: "#080c14",
        darkCard: "rgba(13, 20, 35, 0.75)",
        darkBorder: "rgba(255, 255, 255, 0.08)",
        neonBlue: {
          DEFAULT: "#00f2fe",
          glow: "rgba(0, 242, 254, 0.15)",
          hover: "#33f5ff",
          text: "#00d2dc"
        },
        neonPurple: {
          DEFAULT: "#bd5eff",
          glow: "rgba(189, 94, 255, 0.15)",
          hover: "#c97eff",
          text: "#aa3eff"
        },
        neonGreen: {
          DEFAULT: "#39ff14",
          glow: "rgba(57, 255, 20, 0.15)",
          hover: "#61ff46",
          text: "#2ecc71"
        },
        neonOrange: {
          DEFAULT: "#ff9f1c",
          glow: "rgba(255, 159, 28, 0.15)",
          hover: "#ffaf42",
          text: "#e67e22"
        },
        neonRed: {
          DEFAULT: "#ff4757",
          glow: "rgba(255, 71, 87, 0.15)",
          hover: "#ff6b81",
          text: "#ff2e44"
        }
      },
      fontFamily: {
        sans: ["var(--font-outfit)", "Inter", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow-slow": "glow 4s ease-in-out infinite alternate",
        "spin-slow": "spin 8s linear infinite",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(0, 242, 254, 0.2), 0 0 10px rgba(0, 242, 254, 0.1)" },
          "100%": { boxShadow: "0 0 15px rgba(0, 242, 254, 0.4), 0 0 25px rgba(0, 242, 254, 0.2)" },
        }
      }
    },
  },
  plugins: [],
};
