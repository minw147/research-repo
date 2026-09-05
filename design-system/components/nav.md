# Nav

**Source:** `src/components/builder/WorkspaceNav.tsx`

The workspace navigation bar. Fixed at the top of every builder page. Contains: skip link, brand mark + home link, project title, tab navigation, codebook button, help link.

## Shell

```tsx
<nav className="flex h-12 items-center gap-3 border-b border-stone-200 bg-white px-4 sm:px-6">
```

The nav has **no shadow** — flat white bar with a hairline bottom border. `shadow-dialog` is reserved for modals and floating popovers, not the nav.

Height is always `h-12` (48px) — this also satisfies the 44px touch target for tab buttons.

## Skip Link (Required)

Must be the **first element** inside `<nav>`:

```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:text-sm focus:font-semibold"
>
  Skip to content
</a>
```

The target `<main id="main-content">` must exist on every page that uses this nav.

## Home Link (Brand Mark)

```tsx
<Link href="/" aria-label="Research Hub home" className="flex shrink-0 items-center gap-2 -m-1 p-1 rounded-lg">
  <BrandMark size={22} wordmarkClassName="text-sm hidden sm:inline" />
</Link>
```

`BrandMark` (`src/components/shared/BrandMark.tsx`) is a custom SVG badge (a ribbon/ID-badge shape, not a Lucide icon) on a `bg-pine-800` rounded square, plus the "Research *Hub*" serif wordmark with the accent word in italic clay. **Never** substitute a Lucide icon (e.g. `FlaskConical`) for the badge — it's a bespoke mark.

## Tab Navigation

```tsx
<div role="tablist" aria-label="Workspace navigation" className="flex h-full items-center gap-1">
  <Link
    role="tab"
    aria-selected={isActive}
    className={`flex h-full min-w-[44px] items-center justify-center gap-1.5 border-b-2 px-3 text-[12.5px] whitespace-nowrap transition-colors duration-200 ${
      isActive
        ? "border-primary text-stone-900 font-semibold"
        : "border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300"
    }`}
  >
    <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-primary" : ""}`} />
    <span className="hidden md:inline">{tab.label}</span>
  </Link>
</div>
```

Active tab: `border-primary` (sage) bottom underline + `text-stone-900` + icon in `text-primary`. Inactive: `border-transparent text-stone-500`.

## Right-aligned ghost items (Codebook, Help)

```tsx
className="flex items-center gap-1.5 rounded px-2 py-1.5 text-xs text-stone-600 hover:bg-stone-100"
```

## Accessibility

- `role="tablist"` on the tab container, `role="tab"` + `aria-selected` on each tab link.
- Skip link visible on keyboard focus.
- All interactive elements: `focus:ring-2 focus:ring-primary focus:ring-offset-2`.
- Icon-only buttons use `aria-label`.
