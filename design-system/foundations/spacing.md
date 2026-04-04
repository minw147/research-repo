# Spacing

## Spacing Scale

| Step | Value | Usage |
|------|-------|-------|
| `gap-1` | 0.25rem | Icon gaps, tight inline spacing |
| `gap-2` | 0.5rem | Inline elements, compact padding |
| `gap-3` | 0.75rem | Button internal padding |
| `gap-4` | 1rem | Card padding, section gaps |
| `gap-6` | 1.5rem | Section padding, card grid gap |
| `p-8` | 2rem | Large section padding |
| `py-12` | 3rem | Page-level block separation |

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

Minimum **44×44px** for all interactive elements on mobile. Use `min-h-[44px] min-w-[44px]` or ensure padding achieves this.

Nav tabs use `h-full` (nav is `h-12` = 48px) and `min-w-[44px]` to meet this automatically.
