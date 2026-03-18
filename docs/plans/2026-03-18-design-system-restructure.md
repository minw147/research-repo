# Design System Restructure Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restructure `design-system/` from a flat MASTER.md + pages/ layout into a professional Foundations + Components + Patterns structure — pure markdown, no code changes, no tests.

**Architecture:** Delete MASTER.md and pages/. Create three subfolders: `foundations/` (tokens and visual language), `components/` (one file per component), `patterns/` (cross-component rules). A new `README.md` serves as the navigable index. All content is migrated from MASTER.md plus what's directly observable in the current codebase.

**Tech Stack:** Markdown only. No tooling changes. Files live in `design-system/`.

---

### Task 1: Create folder skeleton + README.md

**Files:**
- Create: `design-system/README.md`
- Create (empty dirs): `design-system/foundations/`, `design-system/components/`, `design-system/patterns/`

**Step 1: Create the three subdirectory placeholder files**

On Windows bash, create the dirs by writing a `.gitkeep` — the actual content files will replace these in later tasks. Instead, just create README.md now; git will track the folders once files exist inside them.

**Step 2: Write `design-system/README.md`**

```markdown
# Research Hub — Design System

**Brand:** Analytical, warm, editorial. The burnt orange primary (`#f59f0a`) is the soul of the palette — every surface decision flows from it.

**Stack:** Next.js 14 · TypeScript · Tailwind CSS 3 · Lucide React

---

## Quick Token Reference

| Token | Value | Tailwind class |
|-------|-------|----------------|
| Primary | `#f59f0a` | `primary` |
| Primary dark | `#d97706` | `primary-dark` |
| Background light | `#f8f7f5` | `background-light` |
| Background dark | `#221c10` | `background-dark` |
| Surface dark | `#2a1f0e` | `surface-dark` |
| Border dark | `#4a3520` | `border-dark` |
| Body text | — | `text-slate-900` |
| Secondary text | — | `text-slate-600` |
| Muted | — | `text-slate-500` |
| Borders | — | `border-slate-200` |

---

## Index

### Foundations
| File | What it covers |
|------|----------------|
| [foundations/colors.md](foundations/colors.md) | Full palette, dark mode tokens, usage rules |
| [foundations/typography.md](foundations/typography.md) | DM Sans + Inter, type scale, when to use `font-display` |
| [foundations/spacing.md](foundations/spacing.md) | Spacing scale, container pattern, border radius |
| [foundations/motion.md](foundations/motion.md) | Transition rules, `prefers-reduced-motion`, easing |

### Components
| File | Source |
|------|--------|
| [components/button.md](components/button.md) | Sitewide buttons |
| [components/badge.md](components/badge.md) | `src/components/projects/ProjectCard.tsx` |
| [components/callout.md](components/callout.md) | `src/components/shared/Callout.tsx` |
| [components/card.md](components/card.md) | `src/components/projects/ProjectCard.tsx` |
| [components/empty-state.md](components/empty-state.md) | `src/components/projects/ProjectEmptyState.tsx` |
| [components/modal.md](components/modal.md) | `NewProjectModal`, `PromptModal`, `PublishModal`, `QuoteEditModal` |
| [components/nav.md](components/nav.md) | `src/components/builder/WorkspaceNav.tsx` |
| [components/quote-card.md](components/quote-card.md) | `src/components/builder/QuoteCard.tsx` |
| [components/terminal.md](components/terminal.md) | `src/components/builder/AgentRunner.tsx` |

### Patterns
| File | What it covers |
|------|----------------|
| [patterns/button-hierarchy.md](patterns/button-hierarchy.md) | When to use primary vs ghost vs plain-text |
| [patterns/dark-mode.md](patterns/dark-mode.md) | Warm token rule, current coverage |
| [patterns/accessibility.md](patterns/accessibility.md) | WCAG rules: focus rings, skip links, color+icon |
| [patterns/loading-states.md](patterns/loading-states.md) | Spinner usage, skeleton pattern (future) |

---

## Contributing

1. Use semantic tokens (`primary`, `slate-*`) — never raw palette values (`blue-*`, `indigo-*`)
2. Follow the typography scale — no ad-hoc `text-[13px]`
3. Every new component gets a file in `components/`
4. Every cross-component rule goes in `patterns/` not inside a component file
5. Dark surfaces: warm palette only — no `slate-800`, `slate-900`, or cool hex values
```

**Step 3: Commit**

```bash
git add design-system/README.md
git commit -m "docs: add design system README and index"
```

---

### Task 2: Create `foundations/colors.md`

**Files:**
- Create: `design-system/foundations/colors.md`

**Step 1: Write the file**

```markdown
# Colors

## Light Palette

### Accent (Primary)

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `primary` | `#f59f0a` | `primary` | CTAs, active nav, icon accent, focus rings |
| `primary-dark` | `#d97706` | `primary-dark` | Hover state on solid primary buttons |
| `primary/10` | — | `primary/10` | Soft backgrounds, selected/active state chips |
| `primary/15` | — | `primary/15` | Empty state icon backgrounds |
| `primary/5` | — | `primary/5` | Hover backgrounds on ghost elements |
| `primary/20` | — | `primary/20` | Soft selected state — **not for focus rings** |
| `primary/30` | — | `primary/30` | Panel separator hover |
| `primary/40` | — | `primary/40` | Card border hover (`hover:border-primary/40`) |

### Surfaces

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `background-light` | `#f8f7f5` | `background-light` | Page background |
| — | `white` | `bg-white` | Cards, modals, panels |
| — | `slate-50` | `bg-slate-50` | Secondary surfaces, empty states, muted areas |

### Neutrals (slate scale — always slate, never gray)

| Usage | Class |
|-------|-------|
| Body text | `text-slate-900` |
| Secondary text | `text-slate-600` |
| Muted / placeholder | `text-slate-500` |
| Disabled / subtle | `text-slate-400` |
| Borders | `border-slate-200` |
| Dividers | `border-slate-100` |
| Muted backgrounds | `bg-slate-50`, `bg-slate-100` |

> **Rule:** Always use `slate-*`. Never mix `gray-*` into the same codebase — the hues are incompatible.

### Semantic Colors

| Role | Background | Text | Border |
|------|-----------|------|--------|
| Danger / error | `bg-red-50` | `text-red-600` | `border-red-200` |
| Success | `bg-green-50` | `text-green-600` | `border-green-200` |
| Warning / info | `bg-amber-50` | `text-amber-700` | `border-amber-100` |

---

## Dark Palette

Dark surfaces must stay in the **warm amber-brown** temperature range. The app uses a warm primary — introducing cool blue-slate in dark contexts creates thermal incoherence.

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `background-dark` | `#221c10` | `background-dark` | Page background in dark mode |
| `surface-dark` | `#2a1f0e` | `surface-dark` | Cards, panels, settings chrome |
| `border-dark` | `#4a3520` | `border-dark` | Borders and dividers |
| Terminal body | `#1c1108` | (raw hex) | Code/agent terminal background — darker than surface |
| Terminal text | — | `text-amber-50` | Primary text inside terminal |
| Terminal muted | — | `text-amber-200/70` | Labels inside terminal |

> **Rule:** Never use `slate-800`, `slate-900`, `bg-[#1a2632]`, or any cool hex in dark surfaces. These will always clash with the warm palette.

---

## Usage Rules

- **CTA buttons:** `bg-primary text-white` (solid) or `bg-primary/10 text-primary` (soft accent — secondary only)
- **Focus rings:** `focus:ring-primary` full opacity — never `focus:ring-primary/20` (fails WCAG 1.4.11)
- **Hover on cards:** `hover:border-primary/40` — subtle amber tint on the border
- **Active nav tab:** `border-primary text-slate-900` — bottom border underline treatment
```

**Step 2: Commit**

```bash
git add design-system/foundations/colors.md
git commit -m "docs: add foundations/colors.md"
```

---

### Task 3: Create `foundations/typography.md`

**Files:**
- Create: `design-system/foundations/typography.md`

**Step 1: Write the file**

```markdown
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
```

**Step 2: Commit**

```bash
git add design-system/foundations/typography.md
git commit -m "docs: add foundations/typography.md"
```

---

### Task 4: Create `foundations/spacing.md`

**Files:**
- Create: `design-system/foundations/spacing.md`

**Step 1: Write the file**

```markdown
# Spacing

## Spacing Scale

| Step | Value | Usage |
|------|-------|-------|
| `space-1` / `gap-1` | 0.25rem | Icon gaps, tight inline spacing |
| `space-2` / `gap-2` | 0.5rem | Inline elements, compact padding |
| `space-3` / `gap-3` | 0.75rem | Button internal padding |
| `space-4` / `gap-4` | 1rem | Card padding, section gaps |
| `space-6` / `gap-6` | 1.5rem | Section padding, card grid gap |
| `space-8` | 2rem | Large section padding |
| `space-12` | 3rem | Page-level block separation |

---

## Container Pattern

```tsx
// Standard page container
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
```

All main page content is constrained to `max-w-7xl`. Never use fixed pixel widths for content containers.

---

## Card Grid Pattern

```tsx
// Standard project card grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
```

---

## Border Radius Matrix

| Token | Value | Usage |
|-------|-------|-------|
| `rounded` (default) | 0.25rem | Inputs, checkboxes, small chips |
| `rounded-lg` | 0.5rem | Buttons, tags, small cards, toggles |
| `rounded-xl` | 0.75rem | Cards, modals, larger containers |
| `rounded-2xl` | 1rem | Large modals, panel containers |
| `rounded-full` | 9999px | Pills, avatar circles, status badge |

---

## Touch Targets

Minimum **44×44px** for all interactive elements on mobile. Use `min-h-[44px] min-w-[44px]` or ensure padding achieves this (e.g. `p-2.5` on a small icon = 42px — add `min-h-[44px]`).

Nav tabs use `h-full` (nav is `h-12` = 48px) and `min-w-[44px]` to meet this automatically.
```

**Step 2: Commit**

```bash
git add design-system/foundations/spacing.md
git commit -m "docs: add foundations/spacing.md"
```

---

### Task 5: Create `foundations/motion.md`

**Files:**
- Create: `design-system/foundations/motion.md`

**Step 1: Write the file**

```markdown
# Motion

## Core Rule

**Never use `transition-all`.** It transitions every CSS property including layout properties (width, height, padding, margin) which causes layout thrashing and jank.

Always specify exactly which properties to transition:

```tsx
// ❌ Wrong
className="transition-all duration-200"

// ✅ Correct
className="transition-colors duration-200"
className="transition-[border-color,box-shadow] duration-200"
className="transition-[opacity,transform] duration-200"
```

---

## Duration Scale

| Duration | Usage |
|----------|-------|
| `duration-150` | Micro-interactions: hover backgrounds, icon color changes |
| `duration-200` | Standard: button state changes, border color, opacity |
| `duration-300` | Larger elements: modal entrance, panel slide |

---

## Common Transition Patterns

```tsx
// Button / interactive element color change
className="transition-colors duration-200"

// Card border + shadow on hover
className="transition-[border-color,box-shadow] duration-200"

// Fade in/out (e.g. output log)
className="transition-opacity duration-200"

// Skip link appearing on focus
className="transition-[visibility,opacity] duration-150"
```

---

## Reduced Motion

`src/app/globals.css` already implements `@media (prefers-reduced-motion: reduce)` which collapses all `animation-duration` and `transition-duration` to `0.01ms`. This applies automatically — no per-component work needed.

---

## Easing

Tailwind's default `ease` (cubic-bezier(0.4, 0, 0.2, 1)) is appropriate for all standard transitions. Do not introduce bounce or elastic easing — they feel dated and don't match the editorial brand tone.
```

**Step 2: Commit**

```bash
git add design-system/foundations/motion.md
git commit -m "docs: add foundations/motion.md"
```

---

### Task 6: Create `components/button.md`

**Files:**
- Create: `design-system/components/button.md`

**Step 1: Write the file**

```markdown
# Button

Buttons are sitewide — no single source file. The variants below are the canonical implementations drawn from across the codebase.

## Variants

| Variant | Classes | When to use |
|---------|---------|-------------|
| **Primary** | `bg-primary text-white rounded-lg px-4 py-2 text-sm font-bold hover:bg-primary-dark transition-colors duration-200 cursor-pointer` | The single most important action in a group (Run, Save, Add Session, Send) |
| **Secondary** | `border border-slate-200 bg-white text-slate-700 rounded-lg px-4 py-2 text-sm font-semibold hover:bg-slate-50 transition-colors duration-200 cursor-pointer` | Alternative action of equal importance to primary when two CTAs exist |
| **Ghost / icon** | `p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors duration-200 cursor-pointer` | Toolbar actions (Refresh, Revert), icon-only controls |
| **Soft accent** | `bg-primary/10 text-primary border border-primary/20 rounded-lg px-2.5 py-1.5 text-xs font-semibold hover:bg-primary/20 transition-colors duration-200 cursor-pointer` | Secondary accent action where primary would be too heavy. Use sparingly — see patterns/button-hierarchy.md |
| **Plain text** | `text-slate-500 hover:text-slate-700 transition-colors duration-200 cursor-pointer` | Low-importance actions (Run again, Cancel) |
| **Danger** | `text-red-400 border border-red-500/50 hover:bg-red-500/10 rounded px-2 py-0.5 transition-colors duration-200 cursor-pointer` | Destructive / stop actions (Stop in AgentRunner) |

## Disabled State

All buttons: `disabled:opacity-50 disabled:cursor-not-allowed`

## Usage

**Do** — use exactly one primary button per action group.
**Do** — use ghost buttons for toolbar controls that sit alongside a primary CTA.
**Don't** — use soft accent (`bg-primary/10`) for the most important action in a group.
**Don't** — give multiple buttons in the same group identical styling when they have different importance levels.

See [patterns/button-hierarchy.md](../patterns/button-hierarchy.md) for the full hierarchy rule.

## Accessibility

- Icon-only buttons require `aria-label` describing the action.
- Minimum 44×44px touch target on mobile.
- All buttons use `focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`.
- Use `<button type="button">` for non-submit buttons to prevent accidental form submission.
```

**Step 2: Commit**

```bash
git add design-system/components/button.md
git commit -m "docs: add components/button.md"
```

---

### Task 7: Create `components/badge.md`

**Files:**
- Create: `design-system/components/badge.md`

**Step 1: Write the file**

```markdown
# Badge

**Source:** `src/components/projects/ProjectCard.tsx`

Status badges communicate the current phase of a project. They always combine **color + icon** — never color alone.

## Status Variants

| Status | Icon (Lucide) | Classes |
|--------|--------------|---------|
| `setup` | `Circle` | `bg-gray-100 text-gray-700 border-gray-200` |
| `findings` | `Search` | `bg-blue-100 text-blue-700 border-blue-200` |
| `tagged` | `Tag` | `bg-purple-100 text-purple-700 border-purple-200` |
| `report` | `FileText` | `bg-green-100 text-green-700 border-green-200` |
| `exported` | `Upload` | `bg-emerald-100 text-emerald-700 border-emerald-200` |
| `published` | `Globe` | `bg-teal-100 text-teal-700 border-teal-200` |

## Shell Classes

```tsx
<span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold border ${statusColors[status]}`}>
  <StatusIcon className="w-2.5 h-2.5 shrink-0" aria-hidden="true" />
  {status}
</span>
```

## Usage

**Do** — always include both the icon and the text label.
**Don't** — use color as the sole differentiator (approximately 8% of males are red-green colorblind).

## Accessibility

- Icon is `aria-hidden="true"` — the text label carries the semantic meaning.
- Color + icon + text = three independent cues. WCAG 1.4.1 (Use of Color) is satisfied.
```

**Step 2: Commit**

```bash
git add design-system/components/badge.md
git commit -m "docs: add components/badge.md"
```

---

### Task 8: Create `components/callout.md`

**Files:**
- Create: `design-system/components/callout.md`

**Step 1: Write the file**

```markdown
# Callout

**Source:** `src/components/shared/Callout.tsx`

Used in MDX reports to highlight key information. Renders a left-bordered block with an icon and optional title.

## Variants

| Variant | Icon | Background | Border | Title color |
|---------|------|-----------|--------|------------|
| `info` (default) | `Info` | `bg-primary/10` | `border-l-primary` | `text-primary-dark` |
| `tip` | `Lightbulb` | `bg-emerald-50` | `border-l-emerald-500` | `text-emerald-800` |
| `warning` | `AlertTriangle` | `bg-amber-50` | `border-l-amber-500` | `text-amber-800` |
| `insight` | `Sparkles` | `bg-violet-50` | `border-l-violet-500` | `text-violet-800` |

## Usage

```tsx
<Callout variant="info" title="Key takeaway">
  Participants consistently preferred the simplified flow.
</Callout>

<Callout variant="warning">
  This finding is based on only 3 sessions — treat as directional.
</Callout>
```

## Shell Classes

```tsx
<div className="report-callout my-6 rounded-r-lg border-l-4 px-5 py-4 {variant.bg} {variant.border}">
```

The `report-callout-content` class (in `globals.css`) handles paragraph spacing inside callouts.

## Accessibility

- Icons are `aria-hidden="true"` — the title text carries meaning.
- Do not rely on color alone to convey the variant — the icon and title text provide additional cues.

## Notes

- Dark mode variants exist for all four (`dark:bg-primary/20`, `dark:bg-emerald-950/40`, etc.)
- Icons are Lucide components — they inherit `currentColor` and can be styled with CSS
```

**Step 2: Commit**

```bash
git add design-system/components/callout.md
git commit -m "docs: add components/callout.md"
```

---

### Task 9: Create `components/card.md`

**Files:**
- Create: `design-system/components/card.md`

**Step 1: Write the file**

```markdown
# Card

**Source:** `src/components/projects/ProjectCard.tsx`

Project cards are the primary unit of the dashboard. They link to the workspace for a project and display status, metadata, and quick actions.

## Classes

```tsx
<Link
  href={`/builder/${project.id}/findings`}
  className="group block p-4 bg-white border border-slate-200 rounded-xl hover:border-primary/40 hover:shadow-lg transition-[border-color,box-shadow] duration-200"
>
```

## Title

Card titles use `font-display` (DM Sans) to differentiate from body copy:

```tsx
<h3 className="font-display text-xl font-semibold text-slate-900 group-hover:text-primary transition-colors">
  {project.title}
</h3>
```

## Hover State

- Border: `border-slate-200` → `hover:border-primary/40`
- Shadow: `hover:shadow-lg`
- Title: `group-hover:text-primary`
- Transition: `transition-[border-color,box-shadow]` (never `transition-all`)

## Usage

**Do** — use `rounded-xl` for cards (not `rounded-lg`).
**Do** — use `group` on the card link so child elements can respond to card-level hover.
**Don't** — nest cards inside cards.
**Don't** — add padding greater than `p-4` on standard cards.

## Accessibility

- The entire card is a `<Link>` — screen readers announce it as a single navigable item.
- Title text is the accessible name of the link; no additional `aria-label` needed.
- Quick-action buttons inside cards use `aria-label` and stop propagation to prevent double-navigation.
```

**Step 2: Commit**

```bash
git add design-system/components/card.md
git commit -m "docs: add components/card.md"
```

---

### Task 10: Create `components/empty-state.md`

**Files:**
- Create: `design-system/components/empty-state.md`

**Step 1: Write the file**

```markdown
# Empty State

**Source:** `src/components/projects/ProjectEmptyState.tsx`

Empty states are brand moments — they should feel warm and guide users toward the next action, not just say "nothing here."

## Pattern

```tsx
<div className="flex flex-col items-center justify-center flex-1 min-h-[320px] px-6 py-12 bg-slate-50 border border-slate-200 rounded-xl text-center">
  {/* Icon: amber circle container */}
  <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mb-6">
    <Mic className="w-8 h-8 text-primary" />
  </div>

  {/* Heading: font-display, outcome-focused */}
  <h3 className="font-display text-lg font-semibold text-slate-800 mb-2">
    No sessions yet
  </h3>

  {/* Body: outcome-focused copy — what they can do, not what's missing */}
  <p className="text-slate-600 text-sm max-w-md mb-6">
    Add a session recording and transcript to start capturing insights and building your report.
  </p>

  {/* CTA: primary button */}
  <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors shadow-sm">
    <Plus className="w-4 h-4" />
    Add Session
  </button>
</div>
```

## Rules

**Do** — use a domain-relevant Lucide icon (e.g. `Mic` for sessions, `FileText` for reports).
**Do** — wrap the icon in a `rounded-full bg-primary/15` container — warm amber circle, not gray.
**Do** — write copy from the outcome perspective ("start capturing insights") not the empty state ("no sessions found").
**Do** — always include a primary CTA that resolves the empty state.
**Don't** — use a gray circle or a generic `Film`/`Box` icon.
**Don't** — show raw file paths or technical information in empty state copy.

## Icon Sizing

Icon container: `w-16 h-16` (64px). Icon inside: `w-8 h-8` (32px).
```

**Step 2: Commit**

```bash
git add design-system/components/empty-state.md
git commit -m "docs: add components/empty-state.md"
```

---

### Task 11: Create `components/modal.md`

**Files:**
- Create: `design-system/components/modal.md`

**Step 1: Write the file**

```markdown
# Modal

**Sources:**
- `src/components/projects/NewProjectModal.tsx`
- `src/components/builder/PromptModal.tsx`
- `src/components/publish/PublishModal.tsx`
- `src/components/builder/QuoteEditModal.tsx`

## Shell

```tsx
{/* Backdrop */}
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
  {/* Panel */}
  <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg mx-4">
    ...
  </div>
</div>
```

## Header Pattern

```tsx
<div className="flex items-center gap-3 p-6 border-b border-slate-100">
  {/* Icon in tinted square */}
  <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
    <SomeIcon className="w-5 h-5" />
  </div>
  <div>
    <h2 className="font-display text-lg font-semibold text-slate-900">Modal Title</h2>
    <p className="text-sm text-slate-500">Optional subtitle</p>
  </div>
</div>
```

## Footer Pattern

```tsx
<div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100">
  <button className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors cursor-pointer">
    Cancel
  </button>
  <button className="px-4 py-2 text-sm font-bold bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors cursor-pointer">
    Confirm
  </button>
</div>
```

## Sizes

| Size | `max-w` class | Use case |
|------|-------------|----------|
| Small | `max-w-sm` | Confirmation dialogs |
| Medium | `max-w-lg` | Standard modals (default) |
| Large | `max-w-2xl` | Multi-step modals (NewProjectModal) |

## Usage

**Do** — use `rounded-2xl` for the modal panel.
**Do** — close on backdrop click and Escape key.
**Don't** — nest a modal inside another modal.

## Accessibility

- Focus must be trapped inside the modal while open.
- First focusable element receives focus on open.
- `role="dialog"` and `aria-modal="true"` on the panel.
- `aria-labelledby` pointing to the modal title `<h2>`.
- Escape key closes the modal.
```

**Step 2: Commit**

```bash
git add design-system/components/modal.md
git commit -m "docs: add components/modal.md"
```

---

### Task 12: Create `components/nav.md`

**Files:**
- Create: `design-system/components/nav.md`

**Step 1: Write the file**

```markdown
# Nav

**Source:** `src/components/builder/WorkspaceNav.tsx`

The workspace navigation bar. Fixed at the top of every builder page. Contains: skip link, home link, project title, tab navigation, codebook button, help link.

## Shell

```tsx
<nav className="flex h-12 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6 shadow-sm">
```

Height is always `h-12` (48px) — this also satisfies the 44px touch target for tab buttons.

## Skip Link (Required)

Must be the **first element** inside `<nav>`:

```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:text-sm focus:font-semibold"
>
  Skip to content
</a>
```

The target `<main id="main-content">` must exist on every page that uses this nav.

## Home Link

```tsx
<Link
  href="/"
  className="flex shrink-0 items-center gap-2 font-semibold text-slate-900 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg -m-1 p-1"
  aria-label="Research Hub home"
>
  <FlaskConical className="h-5 w-5 text-primary" />
  <span className="hidden sm:inline font-bold">Research Hub</span>
</Link>
```

Logo icon: `FlaskConical` from Lucide. Never `Box`.

## Tab Navigation

```tsx
<div role="tablist" aria-label="Workspace navigation" className="flex h-full items-center gap-1">
  <Link
    role="tab"
    aria-selected={isActive}
    aria-label={tab.label}
    className={`flex h-full min-w-[44px] items-center justify-center gap-2 border-b-2 px-3 text-sm font-medium whitespace-nowrap transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
      isActive
        ? "border-primary text-slate-900 font-semibold"
        : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
    }`}
  >
    <Icon className="h-4 w-4 shrink-0" />
    <span className="hidden md:inline">{tab.label}</span>
  </Link>
</div>
```

Active tab: `border-primary` bottom underline + `text-slate-900`. Inactive: `border-transparent text-slate-500`.

## Accessibility

- `role="tablist"` on the tab container, `role="tab"` + `aria-selected` on each tab link.
- Skip link visible on keyboard focus.
- All interactive elements: `focus:ring-2 focus:ring-primary focus:ring-offset-2`.
- Icon-only buttons use `aria-label`.
```

**Step 2: Commit**

```bash
git add design-system/components/nav.md
git commit -m "docs: add components/nav.md"
```

---

### Task 13: Create `components/quote-card.md`

**Files:**
- Create: `design-system/components/quote-card.md`

**Step 1: Write the file**

```markdown
# Quote Card

**Source:** `src/components/builder/QuoteCard.tsx`

Displays a pulled quote from a research session transcript. The left border accent is the strongest single design decision in the app — it anchors the editorial identity.

## Key Classes

```tsx
// Card shell
<div className="border-l-4 border-l-primary bg-white rounded-lg p-4 shadow-sm border border-slate-200">

// Quote text
<p className="text-slate-700 text-sm leading-relaxed italic">"{quote.text}"</p>

// Attribution
<p className="text-slate-500 text-xs mt-2">{speaker} · {timestamp}</p>
```

## Color Scale

Always use `slate-*` for all text in QuoteCard — never `gray-*`. The two scales have incompatible hues:

| Role | Class |
|------|-------|
| Quote text | `text-slate-700` |
| Attribution | `text-slate-500` |
| Muted detail | `text-slate-400` |
| Background | `bg-white` |
| Border | `border-slate-200` |

## Usage

**Do** — keep `border-l-4 border-l-primary` — this is the signature treatment; do not remove or soften it.
**Do** — use `italic` on the quote text.
**Don't** — use `gray-*` color classes — always `slate-*`.
**Don't** — add a right border accent or top/bottom accent; the left-only treatment is intentional.

## Notes

- Dragging a quote card into the markdown editor creates an MDX quote block.
- The `border-l-primary` accent is the visual thread connecting quotes across the workspace to the report.
```

**Step 2: Commit**

```bash
git add design-system/components/quote-card.md
git commit -m "docs: add components/quote-card.md"
```

---

### Task 14: Create `components/terminal.md`

**Files:**
- Create: `design-system/components/terminal.md`

**Step 1: Write the file**

```markdown
# Terminal (Agent Runner)

**Source:** `src/components/builder/AgentRunner.tsx`

The Agent Runner terminal displays streaming output from CLI agent runs. It uses a warm dark palette — not the default VS Code-style cool blue-slate.

## Palette

| Element | Class / Value |
|---------|--------------|
| Body background | `bg-[#1c1108]` |
| Header / chrome | `bg-[#2a1f0e]` (= `surface-dark` token) |
| Borders | `border-[#4a3520]` (= `border-dark` token) |
| Primary text | `text-amber-50` |
| Muted labels | `text-amber-200/70` |
| Tool output | `text-yellow-400` / `text-yellow-500` |
| Success / agent text | `text-green-300` |
| Error text | `text-red-400` |
| Running indicator | `text-green-400 animate-pulse` |
| Stop button | `border-red-500/50 text-red-400 hover:bg-red-500/10` |

## Layout

```tsx
{/* Header bar */}
<div className="bg-[#2a1f0e] px-3 py-1.5 text-xs text-amber-200/70 flex justify-between items-center border-b border-[#4a3520]">
  <span>Agent output</span>
  {/* status indicators */}
</div>

{/* Log body */}
<div className="bg-[#1c1108] font-mono text-xs p-3 max-h-48 overflow-y-auto">
  {logLines.map(...)}
</div>
```

## Log Entry Types

| Kind | Color |
|------|-------|
| `text` (agent response) | `text-green-300` |
| `tool` (tool call) | icon `text-yellow-500`, name `text-yellow-400`, summary `text-slate-500` |
| `stderr` | `text-red-400` |
| `info` (e.g. "Stopped.") | `text-slate-500 italic` |

## Settings Panel

When the settings panel is open, it uses `bg-[#2a1f0e]` with `border-[#4a3520]` borders and `text-amber-200/70` labels — matching the terminal chrome, not the light app surface.

## Usage

**Don't** — use `bg-slate-800`, `bg-slate-900`, or any cool-slate class in this component. The terminal must stay in the warm amber-brown temperature range.
**Don't** — use `text-slate-200` for terminal text — use `text-amber-50`.
```

**Step 2: Commit**

```bash
git add design-system/components/terminal.md
git commit -m "docs: add components/terminal.md"
```

---

### Task 15: Create `patterns/button-hierarchy.md`

**Files:**
- Create: `design-system/patterns/button-hierarchy.md`

**Step 1: Write the file**

```markdown
# Button Hierarchy

The most common design failure in this codebase is **button hierarchy collapse** — giving multiple buttons of different importance levels identical styling. Users cannot tell what to do next.

## The Rule

Every action group must have a clear visual hierarchy:

```
Primary (solid)  →  Ghost / icon  →  Plain text
Most important       Supporting       Least important
```

## Correct Example — Workspace Toolbar

```tsx
{/* Most important: solid primary */}
<button className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-bold hover:bg-primary-dark">
  AI Analyze
</button>

{/* Supporting: ghost icon */}
<button className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md">
  <RefreshCw className="w-4 h-4" />
</button>

{/* Least important: plain text */}
<button className="text-slate-500 hover:text-slate-700 text-sm">
  Run again
</button>
```

## The Anti-Pattern to Avoid

```tsx
{/* ❌ Three buttons with identical bg-primary/10 styling = no hierarchy */}
<button className="bg-primary/10 text-primary border border-primary/20">AI Analyze</button>
<button className="bg-primary/10 text-primary border border-primary/20">Refresh</button>
<button className="bg-primary/10 text-primary border border-primary/20">Done</button>
```

When everything looks equally important, nothing is.

## When `bg-primary/10` (Soft Accent) Is Appropriate

Use soft accent only when:
- It's the **only** button in its group, OR
- It needs to signal "primary brand" at low visual weight (e.g. a chip or filter toggle that is active)

Never use it for the main CTA in a toolbar or form where there are also secondary actions — use solid primary instead.

## Decision Checklist

Before styling a button, ask:
1. Is this the most important action the user should take? → **Solid primary**
2. Is this a supporting action alongside a primary CTA? → **Ghost or plain text**
3. Is this an icon-only toolbar control? → **Ghost** (`p-1.5 hover:bg-slate-100`)
4. Is this a low-stakes / escape action (Cancel, Run again)? → **Plain text**
```

**Step 2: Commit**

```bash
git add design-system/patterns/button-hierarchy.md
git commit -m "docs: add patterns/button-hierarchy.md"
```

---

### Task 16: Create `patterns/dark-mode.md`

**Files:**
- Create: `design-system/patterns/dark-mode.md`

**Step 1: Write the file**

```markdown
# Dark Mode

## The Warm Token Rule

This app uses a warm amber-brown primary. Dark mode must stay in the same color temperature — **never introduce cool blue-slate in dark contexts**.

| Token | Value | Use |
|-------|-------|-----|
| `background-dark` | `#221c10` | Page background |
| `surface-dark` | `#2a1f0e` | Panels, cards, settings chrome |
| `border-dark` | `#4a3520` | Borders, dividers |
| Terminal body | `#1c1108` | Deepest dark surface |

These are also defined in `tailwind.config.ts` as named tokens.

## What's Implemented

| Component | Dark mode status |
|-----------|-----------------|
| `AgentRunner` terminal | ✅ Full warm dark palette |
| `globals.css` slides mode | ✅ Warm token colors |
| `tailwind.config.ts` tokens | ✅ Warm `surface-dark`, `border-dark` |
| Page backgrounds | ⚠️ Partial — `darkMode: "class"` is set but most pages lack `dark:` variants |
| Cards and modals | ❌ Not yet — `bg-white` with no `dark:` override |
| Nav | ❌ Not yet |

## Adding Dark Mode to a Component

The Tailwind `darkMode: "class"` strategy is configured. Dark mode activates when a `dark` class is on a parent element.

```tsx
// Light surface that needs dark mode
<div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark text-slate-900 dark:text-amber-50">
```

## Rules

- **Never** use `dark:bg-slate-800` or `dark:bg-gray-900` — always use the warm tokens.
- `dark:text-slate-200` is acceptable for body text only (close enough to warm-neutral).
- `dark:text-amber-50` for primary text in explicitly dark surfaces (terminal, settings panel).
- Test dark mode at `background-dark` (#221c10) — if text is readable there, it's correct.
```

**Step 2: Commit**

```bash
git add design-system/patterns/dark-mode.md
git commit -m "docs: add patterns/dark-mode.md"
```

---

### Task 17: Create `patterns/accessibility.md`

**Files:**
- Create: `design-system/patterns/accessibility.md`

**Step 1: Write the file**

```markdown
# Accessibility

This app targets **WCAG 2.1 AA**. The rules below are the specific patterns implemented.

---

## Focus Rings

**Rule:** Always `focus:ring-primary` at full opacity with `focus:ring-offset-2`.

```tsx
// ✅ Correct
className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"

// ❌ Wrong — primary/20 has ~1.05:1 contrast, fails WCAG 1.4.11
className="focus:ring-primary/20"
```

This applies to: all buttons, all links, all inputs, all interactive elements.

---

## Skip Links

Every page must have a skip-to-content link as the **first focusable element**, and a `<main id="main-content">` as the target.

```tsx
// In nav / page header — first child
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:text-sm focus:font-semibold"
>
  Skip to content
</a>

// On the main content container
<main id="main-content">
```

Pages where this is implemented: `page.tsx`, `help/page.tsx`, `WorkspaceNav.tsx`.

---

## Color as Sole Differentiator (WCAG 1.4.1)

Never use color as the only way to convey information. Always pair color with an icon, label, or pattern.

**Status badges:** Each status has a unique Lucide icon alongside its color.
**Form errors:** Use `text-red-600` + an error message string + `aria-describedby` pointing to the message.

---

## Icon-Only Controls

Every icon-only button requires `aria-label`:

```tsx
<button aria-label="Refresh file">
  <RefreshCw className="w-4 h-4" aria-hidden="true" />
</button>
```

Icons inside buttons are always `aria-hidden="true"` — the button's `aria-label` carries the meaning.

---

## Tab Navigation ARIA

The workspace nav uses correct ARIA:

```tsx
<div role="tablist" aria-label="Workspace navigation">
  <Link role="tab" aria-selected={isActive} aria-label={tab.label}>
```

---

## Touch Targets

Minimum **44×44px** for all interactive elements. The nav uses `h-12` (48px) with `min-w-[44px]` on tabs. Icon buttons use `p-1.5` (30px) — acceptable in dense toolbars where 44px isn't achievable without breaking layout; prefer `p-2` where space allows.

---

## Semantic HTML

- Use `<button>` for actions, `<a>` / `<Link>` for navigation.
- Use `<nav>`, `<main>`, `<aside>` landmarks.
- Heading hierarchy: don't skip levels (H1 → H2 → H3).
- Form inputs must have `<label htmlFor>` or `aria-label`.
```

**Step 2: Commit**

```bash
git add design-system/patterns/accessibility.md
git commit -m "docs: add patterns/accessibility.md"
```

---

### Task 18: Create `patterns/loading-states.md`

**Files:**
- Create: `design-system/patterns/loading-states.md`

**Step 1: Write the file**

```markdown
# Loading States

## Current Pattern — Spinner

The app currently uses `Loader2` from Lucide React with `animate-spin`:

```tsx
import { Loader2 } from "lucide-react";

// Inline loading (button)
<button disabled>
  <Loader2 className="w-4 h-4 animate-spin text-primary" />
  Loading...
</button>

// Page-level loading
<div className="flex items-center justify-center min-h-[200px]">
  <Loader2 className="w-8 h-8 animate-spin text-primary" />
</div>
```

**Always use `text-primary`** for the spinner color — never `text-indigo-600`, `text-blue-500`, or other raw palette values.

## Consistent Sizes

| Context | Size class |
|---------|-----------|
| Inline / button | `w-4 h-4` |
| Small panel | `w-6 h-6` |
| Page / section | `w-8 h-8` |

Do not introduce new sizes — pick the nearest from this table.

## Running State — Agent Terminal

The agent terminal uses a pulsing dot for streaming state:

```tsx
<span className="animate-pulse text-green-400">● Running...</span>
```

## Future — Skeleton Loaders

For content-heavy lists (project cards, session lists), prefer skeleton loaders over spinners. Skeletons reduce perceived wait time and prevent layout shift. When implementing:

```tsx
// Skeleton card placeholder
<div className="bg-white border border-slate-200 rounded-xl p-4 animate-pulse">
  <div className="h-5 bg-slate-200 rounded w-3/4 mb-3" />
  <div className="h-4 bg-slate-100 rounded w-1/2" />
</div>
```

No skeleton loaders are implemented yet — this is the recommended pattern when added.
```

**Step 2: Commit**

```bash
git add design-system/patterns/loading-states.md
git commit -m "docs: add patterns/loading-states.md"
```

---

### Task 19: Delete MASTER.md and pages/

**Files:**
- Delete: `design-system/MASTER.md`
- Delete: `design-system/pages/codebook-editor.md`
- Delete: `design-system/pages/findings-editor.md`
- Delete: `design-system/pages/landing.md`
- Delete: `design-system/pages/` (now empty)

All content has been migrated into the new structure. The pages/ files were migration guides for a token migration that is complete — they no longer serve a documentation purpose.

**Step 1: Delete files**

```bash
cd d:/research-repo
git rm design-system/MASTER.md
git rm design-system/pages/codebook-editor.md
git rm design-system/pages/findings-editor.md
git rm design-system/pages/landing.md
```

**Step 2: Verify the final structure looks correct**

```bash
find design-system -type f | sort
```

Expected output:
```
design-system/README.md
design-system/components/badge.md
design-system/components/button.md
design-system/components/callout.md
design-system/components/card.md
design-system/components/empty-state.md
design-system/components/modal.md
design-system/components/nav.md
design-system/components/quote-card.md
design-system/components/terminal.md
design-system/foundations/colors.md
design-system/foundations/motion.md
design-system/foundations/spacing.md
design-system/foundations/typography.md
design-system/patterns/accessibility.md
design-system/patterns/button-hierarchy.md
design-system/patterns/dark-mode.md
design-system/patterns/loading-states.md
```

**Step 3: Commit**

```bash
git commit -m "docs: remove MASTER.md and pages/ — content migrated to foundations/components/patterns"
```
