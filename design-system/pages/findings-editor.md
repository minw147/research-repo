# Findings / Tags Editor — Design Overrides

Page: `src/components/builder/DocumentWorkspace.tsx`, `ClipCreator`, `QuoteCard`, `PromptModal`, etc.

## Overrides from Master

- **Toolbar height**: `h-12`.
- **Toolbar buttons**: Soft accent variant `bg-primary/10 text-primary border border-primary/20` for AI Analyze, Refresh; ghost for Save/Revert.
- **Formatted/Raw toggle**: Segment control with `bg-slate-100` container; active `bg-white text-primary shadow-sm`.
- **Codebook modal header**: `bg-slate-50`; icon container `bg-primary/10 text-primary`.
- **Empty state (tags)**: CTA button `bg-primary text-white` (replace emerald).
- **Separator hover**: `hover:bg-primary/30` (replace indigo).
- **Loader**: `text-primary` (replace indigo-600).

## Components to Update

- Replace all `indigo-*` with `primary` or `primary/10`.
- Replace `emerald-*` CTAs with `primary`.
- Ensure icon-only buttons use `aria-label` and ≥44px touch target where needed.
- Quote cards: Use `primary` for accent highlights; keep semantic colors for friction/delight badges.
