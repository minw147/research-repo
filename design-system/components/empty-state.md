# Empty State

**Source:** `src/components/projects/ProjectEmptyState.tsx`

Empty states are brand moments — they should feel warm and guide users toward the next action, not just say "nothing here."

## Pattern

```tsx
<div className="flex flex-col items-center justify-center flex-1 min-h-[320px] px-6 py-12 bg-slate-50 border border-slate-200 rounded-xl text-center">
  {/* Icon: amber circle container */}
  <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mb-6">
    <Mic className="w-8 h-8 text-primary" />
  </div>

  {/* Heading: font-display, outcome-focused */}
  <h3 className="font-display text-lg font-semibold text-slate-800 mb-2">
    No sessions yet
  </h3>

  {/* Body: outcome-focused copy */}
  <p className="text-slate-600 text-sm max-w-md mb-6">
    Add a session recording and transcript to start capturing insights and building your report.
  </p>

  {/* CTA: primary button */}
  <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors shadow-sm">
    <Plus className="w-4 h-4" />
    Add Session
  </button>
</div>
```

## Rules

**Do** — use a domain-relevant Lucide icon (e.g. `Mic` for sessions, `FileText` for reports).
**Do** — wrap the icon in a `rounded-full bg-primary/15` container — warm amber circle, not gray.
**Do** — write copy from the outcome perspective ("start capturing insights") not the empty state ("no sessions found").
**Do** — always include a primary CTA that resolves the empty state.
**Don't** — use a gray circle or a generic `Film`/`Box` icon.
**Don't** — show raw file paths or technical information in empty state copy.

## Icon Sizing

Icon container: `w-16 h-16` (64px). Icon inside: `w-8 h-8` (32px).
