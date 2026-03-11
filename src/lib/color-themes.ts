import type { Project } from "@/types";

export interface ColorTheme {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    accent: string;
    background: string;
    accentLight: string;
    text: string;
  };
}

export const COLOR_THEMES: ColorTheme[] = [
  {
    id: "burnt-orange",
    name: "Burnt Orange",
    description: "Warm amber accent",
    colors: {
      primary: "#f59f0a",
      accent: "#d97706",
      background: "#f8f7f5",
      accentLight: "#fef3c7",
      text: "#0f172a",
    },
  },
  {
    id: "deep-purple",
    name: "Deep Purple & Emerald",
    description: "Tech-forward, high contrast",
    colors: {
      primary: "#7c3aed",
      accent: "#10b981",
      background: "#faf5ff",
      accentLight: "#ede9fe",
      text: "#0f172a",
    },
  },
  {
    id: "ocean-blue",
    name: "Ocean Blue",
    description: "Clean corporate, sky gradient",
    colors: {
      primary: "#3b82f6",
      accent: "#0ea5e9",
      background: "#f0f9ff",
      accentLight: "#e0f2fe",
      text: "#0f172a",
    },
  },
  {
    id: "rose-blush",
    name: "Rose & Blush",
    description: "Soft, editorial",
    colors: {
      primary: "#e11d48",
      accent: "#fb7185",
      background: "#fff1f2",
      accentLight: "#ffe4e6",
      text: "#0f172a",
    },
  },
  {
    id: "midnight-teal",
    name: "Midnight Teal",
    description: "Teal accent, light layout",
    colors: {
      primary: "#14b8a6",
      accent: "#2dd4bf",
      background: "#f0fdfa",
      accentLight: "#ccfbf1",
      text: "#0f172a",
    },
  },
  {
    id: "slate-mono",
    name: "Slate Mono",
    description: "Minimal, neutral",
    colors: {
      primary: "#475569",
      accent: "#64748b",
      background: "#f8fafc",
      accentLight: "#f1f5f9",
      text: "#0f172a",
    },
  },
];

export function buildColorThemePrompt(project: Project, theme: ColorTheme): string {
  const projectDir = `content/projects/${project.id}`;
  const { primary, accent, background, accentLight, text } = theme.colors;

  return `**Output format (CRITICAL):**
- Produce the RAW HTML content for the target file directly.
- DO NOT wrap your output in a markdown code block (no \`\`\`html).
- NO preamble, NO lead-in text.
- APPLY the /ui-ux-pro-max aesthetics per the skill guidelines.

**MANDATORY: Follow the skill.** Read \`.cursor/skills/report-publication/SKILL.md\` and execute its steps.

---
## Task

Read \`findings.html\` in the project directory \`${projectDir}\`.
Redesign the HTML report using the following color theme: **${theme.name}**.

### Color palette (light backgrounds only—no dark fills)
| Role | Hex | Usage |
|------|-----|-------|
| Primary | ${primary} | CTAs, accents, active states, badges, borders |
| Accent | ${accent} | Secondary highlights, gradients, hover |
| Background | ${background} | Page background |
| Accent light | ${accentLight} | Header, recommendation section, callout panels (light tint only) |
| Text | ${text} | Body text, headings |

### Instructions
- Replace all color values in the inline CSS with the new palette above
- **Do NOT use dark backgrounds anywhere.** Header and recommendation sections must use light backgrounds (e.g. \`accentLight\` or \`background\`), never dark fills
- Preserve all content, video clips, structure, and layout
- Keep the same typography (Inter), spacing, and component patterns
- Follow \`.cursor/skills/report-publication/SKILL.md\`
- Output raw HTML directly to \`findings.html\` (no code blocks).`;
}

export const TAG_COLORS: string[] = [
  "#f59f0a", "#3b82f6", "#10b981", "#ef4444",
  "#8b5cf6", "#f97316", "#06b6d4", "#ec4899",
  "#84cc16", "#6366f1", "#14b8a6", "#f43f5e",
];

/**
 * Returns the first TAG_COLORS entry not already used.
 * Falls back to the first color if all are taken.
 */
export function assignTagColor(inUseColors: string[]): string {
  const used = new Set(inUseColors.map((c) => c.toLowerCase()));
  return (
    TAG_COLORS.find((c) => !used.has(c.toLowerCase())) ?? TAG_COLORS[0]
  );
}
