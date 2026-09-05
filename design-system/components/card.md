# Card

**Source:** `src/components/projects/ProjectCard.tsx`

Project cards are the primary unit of the dashboard. They link to the workspace for a project and display status, metadata, and quick actions.

## Classes

```tsx
<Link
  href={`/builder/${project.id}/findings`}
  className="group block bg-white border border-stone-200 rounded-md p-4 hover:border-primary/40 transition-[border-color] duration-200"
>
```

## Title

Card titles use `font-serif` (Newsreader) to differentiate from body copy:

```tsx
<h3 className="font-serif font-semibold text-[16px] leading-[1.3] text-stone-900 group-hover:text-primary transition-colors">
  {project.title}
</h3>
```

## Hover State

- Border: `border-stone-200` → `hover:border-primary/40` (sage, not clay — hover is an interactive-state cue, not a CTA)
- Title: `group-hover:text-primary`
- Transition: `transition-[border-color]` (never `transition-all`)
- **No shadow.** The border-color shift alone carries the hover state — content cards never get `hover:shadow-*`. The only shadow token in the system is `shadow-dialog` (modals, floating popovers, FAB).

## Usage

**Do** — use `rounded-md` (8px) for cards.
**Do** — use `group` on the card link so child elements can respond to card-level hover.
**Do** — use `p-4` (16px) card padding.
**Don't** — nest cards inside cards.
**Don't** — add a shadow to a card, on hover or otherwise.
**Do** — zero-pad session/item counts in card footers (`"05 sessions"`, not `"5 sessions"`) — a small but consistent Mint Leaf detail.

## Accessibility

- The entire card is a `<Link>` — screen readers announce it as a single navigable item.
- Title text is the accessible name of the link; no additional `aria-label` needed.
- Quick-action buttons inside cards use `aria-label` and stop propagation to prevent double-navigation.
