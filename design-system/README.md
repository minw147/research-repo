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
