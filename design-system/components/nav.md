# Nav

**Source:** `src/components/builder/WorkspaceNav.tsx`

The workspace navigation bar. Fixed at the top of every builder page. Contains: skip link, home link, project title, tab navigation, codebook button, help link.

## Shell

```tsx
<nav className="flex h-12 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6 shadow-sm">
```

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

## Home Link

```tsx
<Link
  href="/"
  className="flex shrink-0 items-center gap-2 font-semibold text-slate-900 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg -m-1 p-1"
  aria-label="Research Hub home"
>
  <FlaskConical className="h-5 w-5 text-primary" />
  <span className="hidden sm:inline font-bold">Research Hub</span>
</Link>
```

Logo icon: `FlaskConical` from Lucide. Never `Box`.

## Tab Navigation

```tsx
<div role="tablist" aria-label="Workspace navigation" className="flex h-full items-center gap-1">
  <Link
    role="tab"
    aria-selected={isActive}
    aria-label={tab.label}
    className={`flex h-full min-w-[44px] items-center justify-center gap-2 border-b-2 px-3 text-sm font-medium whitespace-nowrap transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
      isActive
        ? "border-primary text-slate-900 font-semibold"
        : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
    }`}
  >
    <Icon className="h-4 w-4 shrink-0" />
    <span className="hidden md:inline">{tab.label}</span>
  </Link>
</div>
```

Active tab: `border-primary` bottom underline + `text-slate-900`. Inactive: `border-transparent text-slate-500`.

## Accessibility

- `role="tablist"` on the tab container, `role="tab"` + `aria-selected` on each tab link.
- Skip link visible on keyboard focus.
- All interactive elements: `focus:ring-2 focus:ring-primary focus:ring-offset-2`.
- Icon-only buttons use `aria-label`.
