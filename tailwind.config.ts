import type { Config } from "tailwindcss";

// Mint Leaf redesign: warm stone/pine/clay/ochre palette, IBM Plex Sans/Mono +
// Newsreader serif. Replaces the Notion-blue token set (see git history for
// that migration) — see design canvas "Research Hub UI Redesign".
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // --- Brand (this artboard overrides brand-primary to sage, not pine) ---
        primary: "#6B7A5E",        // sage — active tab, links, "Open →"
        "primary-dark": "#55624B", // hover state
        "primary-fg": "#ffffff",

        pine: {
          700: "#1F4B3F",
          800: "#16382F", // brand mark badge background
        },
        clay: {
          600: "#C1502E", // brand-accent — primary CTA buttons, italic "Hub", quote highlights
        },
        ochre: {
          600: "#B8862E", // brand-highlight — taglines, "Finding X of Y"
        },

        // --- Canvas / surfaces ---
        "background-light": "#FAF7F2", // stone-50, page background
        "surface-white": "#ffffff",    // surface-card — explicit white, reads whiter than the page

        // --- Stone text/border ramp ---
        stone: {
          50: "#FAF7F2",
          100: "#F1ECE3",
          200: "#E4DDD0",
          300: "#CFC5B4",
          400: "#A79C89",
          500: "#8A7F6E",
          600: "#6B6153",
          700: "#4F473C",
          900: "#24211D",
        },

        // --- Status dots (project card status, reused from the shared Mint Leaf status set) ---
        "status-right": "#2F6F4E",  // published
        "status-back": "#4A5A8C",   // exported
      },
      fontFamily: {
        display: ["var(--font-newsreader)", "Newsreader", "Georgia", "serif"],
        serif: ["var(--font-newsreader)", "Newsreader", "Georgia", "serif"],
        sans: ["var(--font-plex-sans)", "IBM Plex Sans", "sans-serif"],
        mono: ["var(--font-plex-mono)", "IBM Plex Mono", "monospace"],
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "6px", // radius-default
        md: "8px",
        lg: "10px",
        full: "9999px",
      },
      boxShadow: {
        dialog: "0 20px 40px -8px rgba(36,33,29,0.18)", // the one shadow — modal panels only
        "product-ui": "0px 4px 12px rgba(0,0,0,0.1)",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
export default config;
