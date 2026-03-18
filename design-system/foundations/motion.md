# Motion

## Core Rule

**Never use `transition-all`.** It transitions every CSS property including layout properties (width, height, padding, margin) which causes layout thrashing and jank.

Always specify exactly which properties to transition:

```tsx
// Wrong
className="transition-all duration-200"

// Correct
className="transition-colors duration-200"
className="transition-[border-color,box-shadow] duration-200"
className="transition-[opacity,transform] duration-200"
```

---

## Duration Scale

| Duration | Usage |
|----------|-------|
| `duration-150` | Micro-interactions: hover backgrounds, icon color changes |
| `duration-200` | Standard: button state changes, border color, opacity |
| `duration-300` | Larger elements: modal entrance, panel slide |

---

## Common Transition Patterns

```tsx
// Button / interactive element color change
className="transition-colors duration-200"

// Card border + shadow on hover
className="transition-[border-color,box-shadow] duration-200"

// Fade in/out
className="transition-opacity duration-200"
```

---

## Reduced Motion

`src/app/globals.css` already implements `@media (prefers-reduced-motion: reduce)` which collapses all `animation-duration` and `transition-duration` to `0.01ms`. This applies automatically — no per-component work needed.

---

## Easing

Tailwind's default `ease` (cubic-bezier(0.4, 0, 0.2, 1)) is appropriate for all standard transitions. Do not introduce bounce or elastic easing — they feel dated and don't match the editorial brand tone.
