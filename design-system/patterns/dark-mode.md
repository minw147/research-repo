# Dark Mode

## The Warm Token Rule

This app uses a warm amber-brown primary. Dark mode must stay in the same color temperature — **never introduce cool blue-slate in dark contexts**.

| Token | Value | Use |
|-------|-------|-----|
| `background-dark` | `#221c10` | Page background |
| `surface-dark` | `#2a1f0e` | Panels, cards, settings chrome |
| `border-dark` | `#4a3520` | Borders, dividers |
| Terminal body | `#1c1108` | Deepest dark surface |

These are defined in `tailwind.config.ts` as named tokens.

## Current Coverage

| Component | Dark mode status |
|-----------|-----------------|
| `AgentRunner` terminal | ✅ Full warm dark palette |
| `globals.css` slides mode | ✅ Warm token colors |
| `tailwind.config.ts` tokens | ✅ Warm `surface-dark`, `border-dark` |
| `Callout` shared component | ✅ Has `dark:` variants |
| Page backgrounds | ⚠️ Partial — `darkMode: "class"` is set but most pages lack `dark:` variants |
| Cards and modals | ❌ Not yet — `bg-white` with no `dark:` override |
| Nav | ❌ Not yet |

## Adding Dark Mode to a Component

The Tailwind `darkMode: "class"` strategy is configured. Dark mode activates when a `dark` class is on a parent element.

```tsx
// Light surface that needs dark mode
<div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark text-slate-900 dark:text-amber-50">
```

## Rules

- **Never** use `dark:bg-slate-800` or `dark:bg-gray-900` — always use the warm tokens.
- `dark:text-slate-200` is acceptable for body text only (close enough to warm-neutral).
- `dark:text-amber-50` for primary text in explicitly dark surfaces (terminal, settings panel).
- Test dark mode at `background-dark` (#221c10) — if text is readable there, it's correct.
