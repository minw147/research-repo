# Codebook Editor — Design Overrides

Page: `src/components/builder/CodebookEditor.tsx`.

## Overrides from Master

- **Primary CTA (Save Codebook)**: `bg-primary text-white` (replace blue-600).
- **Form inputs**: `focus:ring-2 focus:ring-primary/20 focus:border-primary`.
- **Add/Edit buttons (inline)**: `bg-primary text-white` for primary; `bg-slate-100 text-slate-600` for secondary.
- **Category edit/delete**: Use `hover:text-primary` for edit, `hover:text-red-600` for delete (danger semantic).
- **Tag color default**: Use `#f59f0a` (primary hex) as default for new tags instead of `#3B82F6`.
- **Info callout**: `bg-amber-50 border-amber-100 text-amber-700` (unchanged; semantic warning).
- **Modal shell**: Same as Master (`rounded-2xl`, `border-slate-200`).

## Components to Update

- Replace all `blue-600`, `blue-700`, `blue-50`, `focus:ring-blue-500/20` with primary tokens.
- Replace `#3B82F6` default tag color with `#f59f0a`.
- Standardize button sizes: primary `px-6 py-2.5`, secondary `px-4 py-2`.
- Use `text-xs font-bold` for small labels; avoid `text-[10px]` unless for badges.
