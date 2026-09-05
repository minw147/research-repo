# Typography

## Font Families

| Role | Family | CSS variable | Tailwind class | When to use |
|------|--------|-------------|----------------|-------------|
| Serif / display | Newsreader | `--font-newsreader` | `font-serif` / `font-display` | H1–H4, card/modal titles, **and quote text (italic)** |
| Sans / UI | IBM Plex Sans | `--font-plex-sans` | `font-sans` (default) | Body copy, labels, buttons, all UI chrome |
| Mono / data | IBM Plex Mono | `--font-plex-mono` | `font-mono` | Timestamps, session/tag chips, dates, file paths, terminal output, micro-labels |

All three load via `next/font/google` in `src/app/layout.tsx`. This supersedes the prior Inter + Source Serif 4 pairing — Newsreader is now a load-bearing font (headings AND quote text), not an optional accent.

> **Rule:** Apply `font-serif` to every heading (`<h1>`–`<h4>`) and to quote/pulled-evidence text (usually combined with `italic`). Do not apply it to labels, body paragraphs, or UI controls — those stay `font-sans` (the default).
> **Rule:** Reach for `font-mono` more than you'd expect — this system uses it heavily for anything data-shaped: dates, timestamps, counts, file paths, adapter names in Storage. If a Notion-blue-era component uses plain `font-sans` for one of these, it's a candidate for a mono fix, not necessarily urgent.

---

## Type Scale

| Role | Size | Weight | Tailwind classes |
|------|------|--------|-----------------|
| H1 (page/dashboard) | 26px | 600 | `font-serif text-[26px] font-semibold` |
| H2 (section) | 20px | 600 | `font-serif text-xl font-semibold` |
| H3 (card / modal title) | 16px | 600 | `font-serif text-base font-semibold` |
| Body | 14px | 400 | `text-sm` |
| Body large (report) | 15–16px | 400 | `text-[15px]` / `text-base` |
| Small / meta | 13px | 400 | `text-[13px]` |
| Micro / label | 10–11px | 600 | `text-[10.5px] font-semibold uppercase tracking-wide` |
| Button label | 14px | 500 | `text-sm font-medium` |
| Quote text | 15–16px | 400 italic | `font-serif italic text-[15px] leading-[1.55]` |

> **Rule:** Buttons use `font-medium` (500) — including the clay CTA buttons — not `font-bold`/`font-semibold`.
> **Rule:** Micro-labels (session counts, status labels, form field labels) are `font-semibold` (600) at 10–11px with `uppercase tracking-wide`, in mono where the content is data-shaped (counts, dates) or plain sans where it's a label (form field names).

---

## Usage Examples

```tsx
// H1 (Dashboard)
<h1 className="font-serif text-[26px] font-semibold text-stone-900">
  Research <span className="italic text-clay-600">Hub</span>
</h1>

// Card title (H3)
<h3 className="font-serif font-semibold text-[16px] text-stone-900">
  {project.title}
</h3>

// Quote text
<p className="font-serif italic text-stone-900 text-[15px] leading-[1.55]">"{quote}"</p>

// Micro label (mono, data-shaped)
<span className="font-mono text-[10.5px] text-stone-500 uppercase tracking-wide">
  {date}
</span>

// Form field label (sans, not data)
<label className="text-[10.5px] font-semibold text-stone-500 uppercase tracking-wide">
  Project Title
</label>
```
