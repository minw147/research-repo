# Accessibility

This app targets **WCAG 2.1 AA**. The rules below are the specific patterns implemented.

---

## Focus Rings

**Rule:** Always `focus:ring-primary` at full opacity with `focus:ring-offset-2`.

```tsx
// Correct
className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"

// Wrong — primary/20 has ~1.05:1 contrast, fails WCAG 1.4.11
className="focus:ring-primary/20"
```

This applies to: all buttons, all links, all inputs, all interactive elements.

---

## Skip Links

Every page must have a skip-to-content link as the **first focusable element**, and a `<main id="main-content">` as the target.

```tsx
// In nav / page header — first child
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:text-sm focus:font-semibold"
>
  Skip to content
</a>

// On the main content container
<main id="main-content">
```

Pages where this is implemented: `page.tsx`, `help/page.tsx`, `WorkspaceNav.tsx`.

---

## Color as Sole Differentiator (WCAG 1.4.1)

Never use color as the only way to convey information. Always pair color with an icon, label, or pattern.

**Status badges:** Each status has a unique Lucide icon alongside its color.
**Form errors:** Use `text-red-600` + an error message string + `aria-describedby` pointing to the message.

---

## Icon-Only Controls

Every icon-only button requires `aria-label`:

```tsx
<button aria-label="Refresh file">
  <RefreshCw className="w-4 h-4" aria-hidden="true" />
</button>
```

Icons inside buttons are always `aria-hidden="true"` — the button's `aria-label` carries the meaning.

---

## Tab Navigation ARIA

The workspace nav uses correct ARIA:

```tsx
<div role="tablist" aria-label="Workspace navigation">
  <Link role="tab" aria-selected={isActive} aria-label={tab.label}>
```

---

## Touch Targets

Minimum **44×44px** for all interactive elements. The nav uses `h-12` (48px) with `min-w-[44px]` on tabs. Icon buttons use `p-1.5` (30px) — acceptable in dense toolbars; prefer `p-2` where space allows.

---

## Semantic HTML

- Use `<button>` for actions, `<a>` / `<Link>` for navigation.
- Use `<nav>`, `<main>`, `<aside>` landmarks.
- Heading hierarchy: don't skip levels (H1 → H2 → H3).
- Form inputs must have `<label htmlFor>` or `aria-label`.
