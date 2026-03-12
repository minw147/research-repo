import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#f59f0a",
        "primary-dark": "#d97706",
        "background-light": "#f8f7f5",
        "background-dark": "#221c10",
        "surface-light": "#ffffff",
        "surface-dark": "#1a2632",
        "border-light": "#e2e8f0",
        "border-dark": "#334155",
      },
      fontFamily: {
        display: ["var(--font-inter)", "Inter", "sans-serif"],
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        full: "9999px",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
export default config;
