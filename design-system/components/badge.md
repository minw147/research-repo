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
