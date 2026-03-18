# Loading States

## Current Pattern — Spinner

The app uses `Loader2` from Lucide React with `animate-spin`:

```tsx
import { Loader2 } from "lucide-react";

// Inline loading (button)
<button disabled>
  <Loader2 className="w-4 h-4 animate-spin text-primary" />
  Loading...
</button>

// Page-level loading
<div className="flex items-center justify-center min-h-[200px]">
  <Loader2 className="w-8 h-8 animate-spin text-primary" />
</div>
```

**Always use `text-primary`** for the spinner color — never `text-indigo-600`, `text-blue-500`, or other raw palette values.

## Consistent Sizes

| Context | Size class |
|---------|-----------|
| Inline / button | `w-4 h-4` |
| Small panel | `w-6 h-6` |
| Page / section | `w-8 h-8` |

Do not introduce new sizes — pick the nearest from this table.

## Running State — Agent Terminal

The agent terminal uses a pulsing dot for streaming state:

```tsx
<span className="animate-pulse text-green-400">● Running...</span>
```

## Future — Skeleton Loaders

For content-heavy lists (project cards, session lists), prefer skeleton loaders over spinners. Skeletons reduce perceived wait time and prevent layout shift. When implementing:

```tsx
// Skeleton card placeholder
<div className="bg-white border border-slate-200 rounded-xl p-4 animate-pulse">
  <div className="h-5 bg-slate-200 rounded w-3/4 mb-3" />
  <div className="h-4 bg-slate-100 rounded w-1/2" />
</div>
```

No skeleton loaders are implemented yet — this is the recommended pattern when added.
