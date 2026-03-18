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
- Icons are Lucide components — they inherit `currentColor` and can be styled with CSS.
