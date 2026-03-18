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
