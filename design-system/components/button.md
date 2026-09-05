# Button

Buttons are sitewide — no single source file. The variants below are the canonical implementations drawn from across the codebase.

## Variants

| Variant | Classes | When to use |
|---------|---------|-------------|
| **Primary (CTA)** | `bg-clay-600 text-white rounded px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity duration-200 cursor-pointer` | The single most important action in a group — New project, Create Project, Publish, AI Analyze, Run in Agent |
| **Secondary (interactive/sage)** | `bg-primary text-white rounded px-4 py-2 text-sm font-medium hover:bg-primary-dark transition-colors duration-200 cursor-pointer` | An action that's important but not the CTA — e.g. Save, Send follow-up. Sage, not clay. |
| **Outline** | `border border-stone-300 bg-white text-stone-900 rounded px-4 py-2 text-sm font-medium hover:bg-stone-50 transition-colors duration-200 cursor-pointer` | Alternative action of equal importance alongside a CTA (e.g. "Connect" on a storage destination) |
| **Ghost / icon** | `p-1.5 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded transition-colors duration-200 cursor-pointer` | Toolbar actions (Refresh, Revert), icon-only controls |
| **Soft accent (clay tint)** | `bg-clay-600/10 text-clay-600 rounded px-2.5 py-1.5 text-xs font-medium transition-colors duration-200 cursor-pointer` | Modal header icon squares, settings-toggle active state |
| **Plain text** | `text-stone-500 hover:text-stone-900 transition-colors duration-200 cursor-pointer` | Low-importance actions (Cancel, Run again) |
| **Danger** | `text-red-700 border border-red-700/40 hover:bg-red-700/10 rounded px-2 py-0.5 transition-colors duration-200 cursor-pointer` | Destructive / stop actions (Stop in AgentRunner). Red is not part of the accent rotation. |

**Two accents, not one** — `clay-600` is the CTA color; `primary` (sage) is for links, active nav, and secondary-important actions. Before defaulting a button to `bg-primary`, check whether the canvas actually shows it in clay — most primary-action buttons in this system are clay, not sage.

## Disabled State

All buttons: `disabled:opacity-50 disabled:cursor-not-allowed` (or `disabled:opacity-40`/`disabled:opacity-60` — minor variance across call sites, not worth normalizing).

## Usage

**Do** — use exactly one clay CTA button per action group.
**Do** — use ghost buttons for toolbar controls that sit alongside a CTA.
**Don't** — use `bg-primary` for the main call-to-action — that's what clay is for.
**Don't** — give multiple buttons in the same group identical styling when they have different importance levels.

## Accessibility

- Icon-only buttons require `aria-label` describing the action.
- Minimum 44×44px touch target on mobile.
- All buttons: `focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`.
- Use `<button type="button">` for non-submit buttons to prevent accidental form submission.
