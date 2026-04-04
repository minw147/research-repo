# Card

**Source:** `src/components/projects/ProjectCard.tsx`

Project cards are the primary unit of the dashboard. They link to the workspace for a project and display status, metadata, and quick actions.

## Classes

```tsx
<Link
  href={`/builder/${project.id}/findings`}
  className="group block p-4 bg-white border border-slate-200 rounded-xl hover:border-primary/40 hover:shadow-lg transition-[border-color,box-shadow] duration-200"
>
```

## Title

Card titles use `font-display` (DM Sans) to differentiate from body copy:

```tsx
<h3 className="font-display text-xl font-semibold text-slate-900 group-hover:text-primary transition-colors">
  {project.title}
</h3>
```

## Hover State

- Border: `border-slate-200` → `hover:border-primary/40`
- Shadow: `hover:shadow-lg`
- Title: `group-hover:text-primary`
- Transition: `transition-[border-color,box-shadow]` (never `transition-all`)

## Usage

**Do** — use `rounded-xl` for cards (not `rounded-lg`).
**Do** — use `group` on the card link so child elements can respond to card-level hover.
**Don't** — nest cards inside cards.
**Don't** — add padding greater than `p-4` on standard cards.

## Accessibility

- The entire card is a `<Link>` — screen readers announce it as a single navigable item.
- Title text is the accessible name of the link; no additional `aria-label` needed.
- Quick-action buttons inside cards use `aria-label` and stop propagation to prevent double-navigation.
