# Colors

## Light Palette

### Accent (Primary)

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `primary` | `#f59f0a` | `primary` | CTAs, active nav, icon accent, focus rings |
| `primary-dark` | `#d97706` | `primary-dark` | Hover state on solid primary buttons |
| `primary/10` | — | `primary/10` | Soft backgrounds, selected/active state chips |
| `primary/15` | — | `primary/15` | Empty state icon backgrounds |
| `primary/5` | — | `primary/5` | Hover backgrounds on ghost elements |
| `primary/20` | — | `primary/20` | Soft selected state — **not for focus rings** |
| `primary/30` | — | `primary/30` | Panel separator hover |
| `primary/40` | — | `primary/40` | Card border hover (`hover:border-primary/40`) |

### Surfaces

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `background-light` | `#f8f7f5` | `background-light` | Page background |
| — | `white` | `bg-white` | Cards, modals, panels |
| — | `slate-50` | `bg-slate-50` | Secondary surfaces, empty states, muted areas |

### Neutrals (slate scale — always slate, never gray)

| Usage | Class |
|-------|-------|
| Body text | `text-slate-900` |
| Secondary text | `text-slate-600` |
| Muted / placeholder | `text-slate-500` |
| Disabled / subtle | `text-slate-400` |
| Borders | `border-slate-200` |
| Dividers | `border-slate-100` |
| Muted backgrounds | `bg-slate-50`, `bg-slate-100` |

> **Rule:** Always use `slate-*`. Never mix `gray-*` into the same codebase — the hues are incompatible.

### Semantic Colors

| Role | Background | Text | Border |
|------|-----------|------|--------|
| Danger / error | `bg-red-50` | `text-red-600` | `border-red-200` |
| Success | `bg-green-50` | `text-green-600` | `border-green-200` |
| Warning / info | `bg-amber-50` | `text-amber-700` | `border-amber-100` |

---

## Dark Palette

Dark surfaces must stay in the **warm amber-brown** temperature range. The app uses a warm primary — introducing cool blue-slate in dark contexts creates thermal incoherence.

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `background-dark` | `#221c10` | `background-dark` | Page background in dark mode |
| `surface-dark` | `#2a1f0e` | `surface-dark` | Cards, panels, settings chrome |
| `border-dark` | `#4a3520` | `border-dark` | Borders and dividers |
| Terminal body | `#1c1108` | (raw hex) | Code/agent terminal background — darker than surface |
| Terminal text | — | `text-amber-50` | Primary text inside terminal |
| Terminal muted | — | `text-amber-200/70` | Labels inside terminal |

> **Rule:** Never use `slate-800`, `slate-900`, `bg-[#1a2632]`, or any cool hex in dark surfaces. These will always clash with the warm palette.

---

## Usage Rules

- **CTA buttons:** `bg-primary text-white` (solid) or `bg-primary/10 text-primary` (soft accent — secondary only)
- **Focus rings:** `focus:ring-primary` full opacity — never `focus:ring-primary/20` (fails WCAG 1.4.11)
- **Hover on cards:** `hover:border-primary/40` — subtle amber tint on the border
- **Active nav tab:** `border-primary text-slate-900` — bottom border underline treatment
