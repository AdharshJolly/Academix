import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)'], // Keeping Space Grotesk as a backup
        display: ['var(--font-display)'], // Fraunces
        accent: ['var(--font-accent)'], // Caveat
        mono: ['var(--font-mono)'], // Courier Prime
      },
      colors: {
        vintage: {
          paper: '#FDFBF7', // Creamy off-white paper
          babyBlue: '#CDE0EE', // Soft striped background blue
          crimson: '#73010b', // Deep crimson
          crimsonLight: '#8a0a18',
          ink: '#2b2b2b', // Soft black for dense text
        }
      },
    },
  },
  plugins: [],
};
export default config;
