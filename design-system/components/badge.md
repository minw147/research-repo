# Badge (Status)

**Source:** `src/components/projects/ProjectCard.tsx`

Status is now a **dot + label**, not a pill badge with an icon. This is a deliberate simplification from the earlier pill/icon convention — don't reintroduce icons or a background pill.

## Status Variants

| Status | Dot color | Tailwind |
|--------|-----------|----------|
| `setup` | stone-400 (neutral) | `bg-stone-400` |
| `findings` | sage | `bg-primary` |
| `tagged` | ochre | `bg-ochre-600` |
| `report` | clay | `bg-clay-600` |
| `exported` | `#4A5A8C` | `bg-status-back` |
| `published` | `#2F6F4E` | `bg-status-right` |

## Shell Classes

```tsx
<div className="flex items-center gap-1.5">
  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDotColors[status]}`} />
  <span className="text-[10px] font-semibold uppercase tracking-wide text-stone-700">
    {statusLabels[status]}
  </span>
</div>
```

## Usage

**Do** — always pair the dot with the text label; the label is what actually carries the status, the dot is a quick-scan accent.
**Don't** — add a background pill or an icon back in — the flat dot+label is intentional across every status this system defines.
**Don't** — reuse `status-back`/`status-right` names to mean anything other than exported/published — they're borrowed from the shared Mint Leaf design system's generic status-color set, repurposed here specifically for these two project statuses.

## Accessibility

- The text label is the accessible name — the dot alone is `aria-hidden` implicitly (no separate `aria-hidden` needed since it carries no text).
- Color is never the sole differentiator — the uppercase label text is always present alongside the dot.
