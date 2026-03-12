# Research Repository Design System — Master

Reference: `stitch.html` (Burnt Orange visual language). This document is the source of truth for UI tokens and patterns. Page-specific overrides live in `design-system/pages/*.md`.

---

## 1. Color Palette

### Accent (Primary)
| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `primary` | `#f59f0a` | `primary` | CTAs, active nav, icon accent |
| `primary-dark` | `#d97706` | `primary-dark` | Hover on solid buttons |
| `primary/10` | — | `primary/10` | Soft backgrounds, selected state |
| `primary/5` | — | `primary/5` | Hover backgrounds |
| `primary/20` | — | `primary/20` | Focus rings |

### Surfaces
| Token | Value | Usage |
|-------|-------|-------|
| `background-light` | `#f8f7f5` | Page background (light) |
| `background-dark` | `#221c10` | Page background (dark) |
| `surface` | `white` | Cards, modals, panels |
| `surface-muted` | `slate-50` | Secondary surfaces, headers |

### Neutrals (slate scale)
| Usage | Class |
|-------|-------|
| Body text | `text-slate-900` |
| Secondary text | `text-slate-600` |
| Muted / placeholder | `text-slate-500` |
| Disabled / subtle | `text-slate-400` |
| Borders | `border-slate-200` |
| Dividers | `border-slate-100` |
| Muted backgrounds | `bg-slate-50`, `bg-slate-100` |

### Semantic
| Role | Classes |
|------|---------|
| Danger / error | `bg-red-50 text-red-600`, `bg-red-100` |
| Success | `bg-green-50 text-green-600`, `bg-green-100` |
| Warning / info | `bg-amber-50 text-amber-700` |

---

## 2. Typography Scale

| Role | Size | Weight | Line-height | Class |
|------|------|--------|-------------|-------|
| H1 (hero) | 2.25–3rem | 800 | 1.2 | `text-3xl` or `text-4xl font-extrabold tracking-tight` |
| H2 (section) | 1.5rem | 700 | 1.25 | `text-2xl font-bold tracking-tight` |
| H3 (card/subs) | 1.25rem | 600 | 1.3 | `text-xl font-semibold` |
| H4 | 1.125rem | 600 | 1.35 | `text-lg font-semibold` |
| Body | 1rem | 400 | 1.5 | `text-base` |
| Body small | 0.875rem | 400 | 1.5 | `text-sm` |
| Caption / label | 0.75rem | 500–600 | 1.4 | `text-xs font-medium` |
| Badge / micro | 0.625rem | 700 | 1 | `text-[10px] font-bold uppercase tracking-wider` |

Font stack: Inter (`font-display`, `font-sans`). Use `tracking-tight` on headings.

---

## 3. Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 0.25rem | Icon gaps |
| `space-2` | 0.5rem | Inline elements, compact padding |
| `space-3` | 0.75rem | Button internal padding |
| `space-4` | 1rem | Card padding, gaps |
| `space-6` | 1.5rem | Section padding |
| `space-8` | 2rem | Large sections |
| `space-12` | 3rem | Page blocks |
| Container | `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` | Main content |

---

## 4. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded` | 0.25rem | Inputs, checkboxes |
| `rounded-lg` | 0.5rem | Buttons, cards, toggles |
| `rounded-xl` | 0.75rem | Large cards, modals |
| `rounded-full` | 9999px | Pills, avatars |

---

## 5. Component Sizing Matrix

### Buttons
| Variant | Height | Padding | Font | Classes |
|---------|--------|---------|------|---------|
| Primary | 40px | `px-4 py-2` | `text-sm font-bold` | `bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors` |
| Secondary | 40px | `px-4 py-2` | `text-sm font-semibold` | `border border-slate-200 bg-white text-slate-700 rounded-lg hover:bg-slate-50` |
| Ghost / icon | 36–40px | `p-1.5` or `p-2` | — | `text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg` |
| Soft accent | 36px | `px-2.5 py-1.5` | `text-xs font-semibold` | `bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20` |

### Icons
| Context | Size | Class |
|---------|------|-------|
| Toolbar / inline | 14px | `h-3.5 w-3.5` |
| Buttons / nav | 16px | `h-4 w-4` |
| Empty state / hero | 24–32px | `h-6 w-6` or `h-8 w-8` |

### Touch targets
Minimum 44×44px for interactive elements (`min-h-[44px] min-w-[44px]` or `p-2.5`).

---

## 6. Interaction States

| State | Pattern |
|-------|---------|
| Hover | `hover:bg-slate-50`, `hover:text-primary`, `hover:border-primary/40` |
| Focus | `focus:ring-2 focus:ring-primary/20 focus:outline-none` |
| Active (pressed) | `active:scale-[0.98]` for buttons (optional) |
| Disabled | `disabled:opacity-50 disabled:cursor-not-allowed` |
| Transition | `transition-colors duration-200` |

---

## 7. Token Mapping (Migration Reference)

Replace existing raw utilities with semantic tokens:

| Old (current) | New (design system) |
|---------------|---------------------|
| `bg-blue-600` | `bg-primary` |
| `hover:bg-blue-700` | `hover:bg-primary-dark` |
| `text-blue-600` | `text-primary` |
| `bg-indigo-50 text-indigo-600` | `bg-primary/10 text-primary` |
| `bg-indigo-100` | `bg-primary/10` |
| `focus:ring-blue-500/20` | `focus:ring-primary/20` |
| `border-indigo-200` | `border-primary/10` |
| `emerald` (CTAs) | `primary` (use accent consistently) |
| `text-[10px]` | `text-[10px] font-bold uppercase tracking-wider` (standard badge) |
| Mixed `rounded-lg`/`rounded-xl` | Use matrix: buttons/cards `rounded-lg`, modals/large cards `rounded-xl` |

---

## 8. Accessibility Baselines

- Color contrast: ≥4.5:1 for body text, ≥3:1 for large text.
- Focus: All interactive elements have visible focus ring (`focus:ring-2 focus:ring-primary/20`).
- Icon-only: Always provide `aria-label` or `title`.
- Touch targets: ≥44×44px on mobile.
- Form labels: Use `<label htmlFor="...">` or `aria-label`.

---

## 9. Verification Checklist

Before claiming UI work complete, verify:

- **Responsive**: Test at 375px, 768px, 1024px, 1440px; no horizontal scroll on mobile.
- **Color contrast**: Body text ≥4.5:1; large text ≥3:1.
- **Focus states**: All interactive elements have visible focus ring (`focus:ring-2 focus:ring-primary/20`).
- **Icon-only**: `aria-label` or `title` on every icon-only button.
- **Touch targets**: ≥44×44px on mobile for primary actions.

---

## 10. Future Contribution Rules

When adding or changing UI:

1. Use semantic tokens (`primary`, `primary/10`, `slate-*`) instead of raw palette (`blue-*`, `indigo-*`).
2. Follow the typography scale; avoid ad hoc `text-[13px]` or similar.
3. Use the button/icon sizing matrix for consistency.
4. Check `design-system/pages/<page>.md` for page-specific overrides before applying global rules.
5. Add `cursor-pointer` to clickable elements.
6. Verify focus states and `aria-label` for icon-only controls.
