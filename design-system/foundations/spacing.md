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
| `rounded` (default) | 4px | Inputs, checkboxes, small chips |
| `rounded-lg` | 8px | Buttons, tags, small cards, toggles |
| `rounded-xl` | 12px | Cards, modals, larger containers |
| `rounded-2xl` | 12px (same as `rounded-xl`) | Kept only for existing className strings during migration — don't reach for it in new code, use `rounded-xl` |
| `rounded-full` | 9999px | Pills, avatar circles, status badge |

> Notion caps rectangular corners at 12px — `rounded-2xl` (previously 1rem/16px) was collapsed to the same 12px as `rounded-xl` in the Notion-style migration, so there's no longer a visual reason to reach past `rounded-xl`.

---

## Touch Targets

Minimum **44×44px** for all interactive elements on mobile. Use `min-h-[44px] min-w-[44px]` or ensure padding achieves this.

Nav tabs use `h-full` (nav is `h-12` = 48px) and `min-w-[44px]` to meet this automatically.
