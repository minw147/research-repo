# Research Hub — Design System

**Brand:** "Mint Leaf" — warm paper, sage green as the interactive accent, terracotta clay as the one reserved CTA color, ochre for editorial highlights. Newsreader serif for headings and quotes, IBM Plex Sans for UI, IBM Plex Mono for timestamps/data. Supersedes the earlier Notion-blue pass — see git history for that palette if needed. The system is light-only; see [patterns/dark-mode.md](patterns/dark-mode.md).

**Stack:** Next.js 14 · TypeScript · Tailwind CSS 3 · Lucide React

---

## Quick Token Reference

| Token | Value | Tailwind class |
|-------|-------|----------------|
| Primary (sage) | `#6B7A5E` | `primary` |
| Primary dark (hover) | `#55624B` | `primary-dark` |
| CTA accent (clay/terracotta) | `#C1502E` | `clay-600` |
| Editorial highlight (ochre) | `#B8862E` | `ochre-600` |
| Background light | `#FAF7F2` | `bg-stone-50` |
| Body text | `#4F473C` | `text-stone-700` |
| Secondary text | `#6B6153` | `text-stone-600` |
| Muted | `#8A7F6E` | `text-stone-500` |
| Hairline border | `#E4DDD0` | `border-stone-200` |
| Form input border | `#CFC5B4` | `border-stone-300` |
| Shadow (the one shadow token) | — | `shadow-dialog` |
| Serif / display font | Newsreader | `font-serif` / `font-display` |
| Sans / UI font | IBM Plex Sans | `font-sans` |
| Mono / data font | IBM Plex Mono | `font-mono` |

---

## Index

### Foundations
| File | What it covers |
|------|----------------|
| [foundations/colors.md](foundations/colors.md) | Full palette, status-dot map, usage rules |
| [foundations/typography.md](foundations/typography.md) | Newsreader + IBM Plex Sans/Mono, type scale |
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
| [components/quote-card.md](components/quote-card.md) | `src/components/builder/QuoteCard.tsx` — the tab-label evidence highlight |
| [components/terminal.md](components/terminal.md) | `src/components/builder/AgentRunner.tsx` — now light-themed, not dark |

### Patterns
| File | What it covers |
|------|----------------|
| [patterns/button-hierarchy.md](patterns/button-hierarchy.md) | When to use clay CTA vs sage vs ghost vs plain-text |
| [patterns/dark-mode.md](patterns/dark-mode.md) | The app is light-only, no exceptions remain |
| [patterns/accessibility.md](patterns/accessibility.md) | WCAG rules: focus rings, skip links, color+icon |
| [patterns/loading-states.md](patterns/loading-states.md) | Spinner usage, skeleton pattern (future) |

---

## Contributing

1. Use semantic tokens (`primary`, `clay-600`, `ochre-600`, the stone scale in [foundations/colors.md](foundations/colors.md)) — never raw palette values (`blue-*`, `green-*` for brand purposes)
2. Two accents, not one: `primary` (sage) for interactive/nav state, `clay-600` for the strongest CTA. Check which one the canvas actually shows before defaulting to `primary`.
3. Follow the typography scale — no ad-hoc `text-[13px]`. Headings and quote text get `font-serif`; nothing else does.
4. Every new component gets a file in `components/`
5. Every cross-component rule goes in `patterns/` not inside a component file
6. The system is light-only — don't add `dark:` variants anywhere, including the terminal
7. Cards and nav never get a shadow except `shadow-dialog` (modals/popovers/FAB) — border-color carries hover state, not elevation
