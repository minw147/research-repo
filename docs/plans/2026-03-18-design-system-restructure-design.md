# Design System Restructure — Design Document

**Date:** 2026-03-18
**Goal:** Restructure `design-system/` from a flat MASTER.md + pages/ pattern into a professional Foundations + Components + Patterns structure that scales for both human designers and AI-assisted development.

---

## Problem

The current structure has three pain points:

1. **MASTER.md is a monolith** — tokens, component specs, accessibility rules, migration notes, and checklists all in one 174-line file. Hard to navigate and easy to conflict.
2. **pages/ was a migration tracker** — those files listed "Components to Update" for a token migration that is now complete. They don't serve a documentation purpose going forward.
3. **No component-level docs** — there are 12+ components in the codebase with no per-component reference. An AI or new developer has no authoritative source for variants, usage rules, or accessibility requirements per component.

---

## Design

### Approach

Foundations + Components + Patterns — the structure used by Shopify Polaris, Atlassian Design System, and IBM Carbon. Each concern lives in its own file; adding a new component or pattern never requires editing another file.

### File Tree

```
design-system/
├── README.md                        ← entry point + index
├── foundations/
│   ├── colors.md                    ← palette, tokens, dark mode rules
│   ├── typography.md                ← DM Sans + Inter, type scale
│   ├── spacing.md                   ← spacing scale, grid, border radius
│   └── motion.md                    ← transition rules, reduced motion
├── components/
│   ├── button.md                    ← variants, hierarchy, classes
│   ├── badge.md                     ← status badges, icon requirement
│   ├── callout.md                   ← variants (info/tip/warn/insight)
│   ├── card.md                      ← ProjectCard, hover states
│   ├── empty-state.md               ← amber icon, outcome copy pattern
│   ├── modal.md                     ← shell, header, footer, animation
│   ├── nav.md                       ← WorkspaceNav, skip link, tabs
│   ├── quote-card.md                ← border accent, slate scale
│   └── terminal.md                  ← AgentRunner, warm dark palette
└── patterns/
    ├── button-hierarchy.md          ← primary / ghost / plain-text rules
    ├── dark-mode.md                 ← warm token rule, current coverage
    ├── accessibility.md             ← WCAG rules: focus, skip, color+icon
    └── loading-states.md            ← spinner usage, skeleton (future)
```

### What Gets Deleted

- `design-system/MASTER.md` — content migrated into the new files
- `design-system/pages/` — these were migration guides for a now-complete token migration; no longer relevant

### Component File Template

Every file in `components/` follows this exact shape:

```markdown
# [Component Name]

**Source:** `src/components/path/Component.tsx`

Brief one-sentence description of what this component is for.

## Variants

| Variant | Classes | When to use |
|---------|---------|-------------|
| Primary | `bg-primary text-white rounded-lg px-4 py-2 text-sm font-bold` | Main CTA, one per action group |
| Ghost   | `p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md` | Secondary / icon actions |

## Usage

**Do** — concise positive rule.
**Don't** — concise negative rule.

## Accessibility

- Bullet per requirement (aria-label, touch target, focus ring, etc.)

## Notes

Gotchas, dark mode behaviour, open issues.
```

### Foundation File Coverage

| File | Key content |
|------|-------------|
| `colors.md` | Full light palette, full dark palette, when `primary/10` vs solid `primary`, "no cool slate in dark" rule |
| `typography.md` | DM Sans (`font-display`) for H1–H3 and card titles; Inter (`font-sans`) for body; full type scale table |
| `spacing.md` | Tailwind spacing scale in use, container pattern (`max-w-7xl mx-auto px-4`), border radius matrix |
| `motion.md` | No `transition-all`; explicit properties only; `prefers-reduced-motion` already in globals.css; easing guidance |

### Pattern File Coverage

| File | Key content |
|------|-------------|
| `button-hierarchy.md` | The primary/ghost/plain-text hierarchy rule; the `bg-primary/10` monoculture anti-pattern |
| `dark-mode.md` | Warm token values, what components have dark variants, what still needs them |
| `accessibility.md` | Skip links, `focus:ring-primary focus:ring-offset-2`, color+icon for status, WCAG references |
| `loading-states.md` | Current spinner usage; skeleton loader pattern for future |

---

## Constraints

- **No code changes** — documentation only; no component rewrites
- **No new tooling** — pure markdown, stays in the repo
- **Content migration only** — all content comes from existing MASTER.md and pages/ files plus what's observable in the current codebase
- **AI-friendly** — each file should be independently readable with full context; avoid cross-file references for critical rules

---

## Success Criteria

1. `design-system/MASTER.md` and `design-system/pages/` are deleted
2. All existing documented rules exist in the new structure (nothing lost)
3. Every component in `src/components/` has a corresponding entry in `components/`
4. A new developer (or AI) can find the canonical classes for any component in one file
5. README.md gives a complete index so navigation doesn't require knowing the structure
