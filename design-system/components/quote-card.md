# Quote Card — the tab-label evidence highlight

**Source:** `src/components/builder/QuoteCard.tsx`

This is **the single most distinctive visual pattern in the app** — a floating, tab-shaped timestamp label pinned to the top-left corner of a clay-tinted box. It replaced the earlier left-border-accent treatment entirely; don't reintroduce a `border-l-4` quote card.

It's reused everywhere a pulled quote/finding appears: the transcript panel, the tag/evidence board, and `Clip.tsx` in published reports. If you're building new "evidence" UI, reuse this pattern rather than inventing a new one.

## Key Classes

```tsx
// Card shell — square top-left corner (where the tab sits), rounded everywhere else
<div className="relative bg-clay-600/5 border border-clay-600/20 rounded-tr-md rounded-br-md rounded-bl-md">

  {/* Floating tab label — timestamp + session, overlapping the top-left corner */}
  <div className="absolute -top-px -left-px flex items-center gap-1.5 bg-clay-600 text-stone-50 font-mono text-[10.5px] px-2 py-0.5 rounded-tl-md rounded-br-md">
    <span className="w-1 h-1 rounded-full bg-stone-50" />
    {timestamp} · S{sessionIndex}
  </div>

  <div className="pt-6 px-3.5 pb-3">
    {/* Quote text — serif italic, not sans */}
    <p className="font-serif italic text-stone-900 text-[15px] leading-[1.55]">"{quote}"</p>

    {/* Tag chips — plain mono chips, no color dot bg-pill treatment beyond a small swatch dot */}
    <span className="inline-flex items-center gap-1.5 bg-stone-100 border border-stone-200 pl-1.5 pr-2 py-0.5 rounded">
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tagColor }} />
      <span className="font-mono text-[10.5px] text-stone-600">{tagLabel}</span>
    </span>
  </div>
</div>
```

## Why this shape

The outer box's top-left corner is square (`rounded-tl-none` implicitly, by omitting that corner utility) so the tab visually "grows out of" the corner rather than floating disconnected. The tab itself is rounded top-left + bottom-right, square top-right + bottom-left — the mirror-image cut that makes it read as a ribbon/flag rather than a badge.

## Color Scale

| Role | Class |
|------|-------|
| Box background | `bg-clay-600/5` |
| Box border | `border-clay-600/20` |
| Tab background | `bg-clay-600` |
| Quote text | `text-stone-900` (serif italic) |
| Tag chip text | `text-stone-600` (mono) |
| Hidden-quote indicator | `text-ochre-600` |

## Usage

**Do** — keep the tab-label treatment intact; it's the signature pattern, don't soften or remove it.
**Do** — use `font-serif italic` on quote text — this is one of the few places italics are used deliberately.
**Do** — reuse this exact pattern for any new "pulled evidence" UI (don't invent a competing quote-card style).
**Don't** — bring back `border-l-4 border-l-primary` — that's the retired pre-Mint-Leaf pattern.
**Don't** — add a card shadow — this component (like all cards) stays flat.

## Notes

- Dragging a quote card into the markdown editor creates an MDX quote block.
- `Clip.tsx` (published-report video embeds) keeps its own richer card shell (video + quote + metadata) but should use the same serif-italic quote text and stone/clay tokens for consistency — see that file directly.
