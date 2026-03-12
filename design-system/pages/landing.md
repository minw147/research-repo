# Landing Page — Design Overrides

Page: `src/app/page.tsx`, `ProjectCard`, `NewProjectModal`, `ProjectEmptyState`.

## Overrides from Master

- **Hero title**: `text-3xl font-extrabold tracking-tight` (matches design system H1).
- **Subtitle**: `text-sm text-slate-600` (matches builder subtitles).
- **Project count badge**: `text-[10px] font-bold uppercase tracking-wider` (matches design system badge).
- **Cards**: `rounded-xl border border-slate-200 hover:border-primary/40` (use primary accent for hover, not blue).
- **New Project tile**: Same border/radius as cards; dashed border; `hover:border-primary/40 hover:bg-primary/5`.
- **Search input**: `focus:ring-2 focus:ring-primary/20`.
- **Spinner**: Use `border-primary` for accent color.
- **Empty state**: Match card treatment; CTA uses `bg-primary`.

## Components to Update

- Replace `blue-600`, `blue-500`, `blue-50` with `primary`, `primary/10`.
- Replace `hover:border-blue-500` with `hover:border-primary/40`.
- Replace `group-hover:text-blue-600` with `group-hover:text-primary`.
