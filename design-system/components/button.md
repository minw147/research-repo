# Button

Buttons are sitewide — no single source file. The variants below are the canonical implementations drawn from across the codebase.

## Variants

| Variant | Classes | When to use |
|---------|---------|-------------|
| **Primary** | `bg-primary text-white rounded-lg px-4 py-2 text-sm font-bold hover:bg-primary-dark transition-colors duration-200 cursor-pointer` | The single most important action in a group (Run, Save, Add Session, Send) |
| **Secondary** | `border border-slate-200 bg-white text-slate-700 rounded-lg px-4 py-2 text-sm font-semibold hover:bg-slate-50 transition-colors duration-200 cursor-pointer` | Alternative action of equal importance when two CTAs exist |
| **Ghost / icon** | `p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors duration-200 cursor-pointer` | Toolbar actions (Refresh, Revert), icon-only controls |
| **Soft accent** | `bg-primary/10 text-primary border border-primary/20 rounded-lg px-2.5 py-1.5 text-xs font-semibold hover:bg-primary/20 transition-colors duration-200 cursor-pointer` | Secondary accent action where primary would be too heavy. Use sparingly — see [patterns/button-hierarchy.md](../patterns/button-hierarchy.md) |
| **Plain text** | `text-slate-500 hover:text-slate-700 transition-colors duration-200 cursor-pointer` | Low-importance actions (Run again, Cancel) |
| **Danger** | `text-red-400 border border-red-500/50 hover:bg-red-500/10 rounded px-2 py-0.5 transition-colors duration-200 cursor-pointer` | Destructive / stop actions (Stop in AgentRunner) |

## Disabled State

All buttons: `disabled:opacity-50 disabled:cursor-not-allowed`

## Usage

**Do** — use exactly one primary button per action group.
**Do** — use ghost buttons for toolbar controls that sit alongside a primary CTA.
**Don't** — use soft accent (`bg-primary/10`) for the most important action in a group.
**Don't** — give multiple buttons in the same group identical styling when they have different importance levels.

## Accessibility

- Icon-only buttons require `aria-label` describing the action.
- Minimum 44×44px touch target on mobile.
- All buttons: `focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`.
- Use `<button type="button">` for non-submit buttons to prevent accidental form submission.
