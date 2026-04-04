# Typography

## Font Families

| Role | Family | CSS variable | Tailwind class | When to use |
|------|--------|-------------|----------------|-------------|
| Display / headings | DM Sans | `--font-dm-sans` | `font-display` | H1, H2, H3, project card titles, modal headings |
| Body | Inter | `--font-inter` | `font-sans` (default) | All body copy, labels, UI text |
| Monospace | System mono | — | `font-mono` | Agent terminal output, code blocks |

Both fonts are loaded via `next/font/google` in `src/app/layout.tsx`. DM Sans adds visual differentiation between structural headings and body content — without it everything reads like a form.

> **Rule:** Apply `font-display` to every `<h1>`, `<h2>`, `<h3>`, and component title (e.g. `<h3 className="font-display ...">` in ProjectCard). Do not apply it to labels, body paragraphs, or UI controls.

---

## Type Scale

| Role | Size | Weight | Line-height | Tailwind classes |
|------|------|--------|-------------|-----------------|
| H1 (hero) | 2.25–3rem | 800 | 1.2 | `font-display text-3xl font-extrabold tracking-tight` |
| H2 (section) | 1.5rem | 700 | 1.25 | `font-display text-2xl font-bold tracking-tight` |
| H3 (card / sub) | 1.25rem | 600 | 1.3 | `font-display text-xl font-semibold` |
| H4 | 1.125rem | 600 | 1.35 | `font-display text-lg font-semibold` |
| Body | 1rem | 400 | 1.5 | `text-base` |
| Body small | 0.875rem | 400 | 1.5 | `text-sm` |
| Caption / label | 0.75rem | 500–600 | 1.4 | `text-xs font-medium` |
| Badge / micro | 0.625rem | 700 | 1 | `text-[10px] font-bold uppercase tracking-wider` |

> **Rule:** Use `tracking-tight` on headings, `tracking-wider` only on micro-labels/badges. Do not introduce ad-hoc sizes like `text-[13px]` — use the nearest scale step.

---

## Usage Examples

```tsx
// H1
<h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-900">
  Research Hub
</h1>

// Card title (H3)
<h3 className="font-display text-xl font-semibold text-slate-900">
  {project.title}
</h3>

// Status badge micro-label
<span className="text-[10px] font-bold uppercase tracking-wider">
  {status}
</span>

// Body caption
<p className="text-sm text-slate-600">Secondary description text</p>
```
