# Colors

## Light Palette — "Mint Leaf" (warm stone / pine / clay / ochre)

This supersedes the earlier Notion-blue token set from the previous redesign pass — see git history if you need that palette's values for reference. Extracted from the design canvas "Research Hub UI Redesign" (Claude Design), not eyeballed.

### Brand

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `primary` | `#6B7A5E` (sage) | `primary` | Active tab, links, "Open →", session-active pill, focus rings |
| `primary-dark` | `#55624B` | `primary-dark` | Hover state on sage elements |
| `clay-600` | `#C1502E` (terracotta) | `clay-600` | **The CTA color** — primary buttons (New project, Create Project, Publish, AI Analyze, Run in Agent), modal header icon tints, quote/evidence tab-labels, italic accent in the wordmark |
| `ochre-600` | `#B8862E` | `ochre-600` | Taglines, "Finding X of Y" eyebrow labels, tagged-status dot |
| `pine-800` | `#16382F` | `pine-800` | Brand mark badge background only |

Two-accent system, not one: **sage (`primary`) for interactive/navigational state**, **clay for the strongest call-to-action**. Don't use `primary` where the canvas shows clay (check `components/button.md`).

### Surfaces

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `background-light` / `stone-50` | `#FAF7F2` | `bg-stone-50` | Page background (paper warmth) |
| — | `white` | `bg-white` | Cards, modals, panels — reads whiter than the page, don't substitute stone-50 |
| `stone-100` | `#F1ECE3` | `bg-stone-100` | Secondary/muted surfaces, chip backgrounds, segmented-control track |

### Stone scale (replaces the ink/graphite/slate scale from the Notion pass)

| Usage | Class | Value |
|-------|-------|-------|
| Heading / strong text | `text-stone-900` | `#24211D` |
| Body text | `text-stone-700` | `#4F473C` |
| Secondary text | `text-stone-600` | `#6B6153` |
| Muted / placeholder | `text-stone-500` | `#8A7F6E` |
| Disabled / faint icon | `text-stone-400` | `#A79C89` |
| Form input borders | `border-stone-300` | `#CFC5B4` |
| Hairline borders / dividers | `border-stone-200` | `#E4DDD0` |

> **Two border weights, not one:** `stone-300` for form inputs (text/select/textarea), `stone-200` for everything else (card edges, dividers, hairlines). This is a real distinction in the canvas — don't collapse them to one value.

> **Transition note:** `text-slate-900` / `text-slate-700` were left in place in several components from the Notion-blue migration where they're close enough at this weight — treat them as equivalent to `text-stone-900` / `text-stone-700` and don't "fix" them on sight unless you're already editing that file for another reason.

### Status dots (project card status — no background pill, just a dot + label)

| Status | Color | Tailwind |
|--------|-------|----------|
| `setup` | stone-400 | `bg-stone-400` |
| `findings` | sage | `bg-primary` |
| `tagged` | ochre | `bg-ochre-600` |
| `report` | clay | `bg-clay-600` |
| `exported` | `#4A5A8C` | `bg-status-back` |
| `published` | `#2F6F4E` | `bg-status-right` |

This replaced the old pill-badge-with-icon pattern entirely — see `components/badge.md`.

### Semantic Colors

| Role | Background | Text | Border |
|------|-----------|------|--------|
| Danger / error | `bg-red-50` | `text-red-600` (or `text-red-700` in the terminal) | `border-red-200` |
| Success | `bg-green-100` | `text-green-600` | — |
| Warning / info | `bg-amber-50` | `text-amber-700` / `text-amber-800` | `border-amber-100` / `border-amber-200` |

One-off semantic colors outside the primary/accent system — never recolor them to clay/sage/ochre.

---

## Typography colors

`@tailwindcss/typography`'s prose classes use **`prose-stone`**, not `prose-slate` — the latter reads visibly cool/blue against the warm palette. Check any new prose usage against this (`grep -rn prose-slate src` should return nothing).

---

## Dark Mode — still dropped

The app is light-only. See `patterns/dark-mode.md`. The Agent Runner terminal is **no longer the dark-surface exception** — the canvas reskinned it to a light stone theme too (see `components/terminal.md`). There is currently no intentionally-dark surface anywhere in the app.

---

## Usage Rules

- **Primary CTA buttons:** `bg-clay-600 text-white font-medium hover:opacity-90` (not `bg-primary` — that's reserved for sage/interactive elements). See `components/button.md`.
- **Secondary/interactive elements:** `bg-primary` (sage) — active tabs, links, session pills, "Open →".
- **Focus rings:** `focus:ring-primary` full opacity.
- **Hover on cards:** `hover:border-primary/40` — border-color shift only, no shadow.
- **Active nav tab:** `border-primary text-stone-900 font-semibold`, icon in `text-primary`.
- **Shadows:** `shadow-dialog` is the one shadow token (modals, floating popovers/dropdowns, FAB). Content cards never get a shadow.
- **Modal header icon tint:** always `bg-clay-600/10 text-clay-600` in a small rounded square, regardless of the modal's subject.
- **Quote/evidence highlight:** the tab-label treatment (`QuoteCard.tsx`) — clay-tinted box with a floating timestamp tab in the top-left corner — is the one signature evidence pattern, reused in the transcript, tag board, and reports (`Clip.tsx`). Don't reintroduce the old left-border-accent card for new quote UI.
