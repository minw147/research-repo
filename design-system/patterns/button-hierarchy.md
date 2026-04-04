# Button Hierarchy

The most common design failure in this codebase is **button hierarchy collapse** — giving multiple buttons of different importance levels identical styling. Users cannot tell what to do next.

## The Rule

Every action group must have a clear visual hierarchy:

```
Primary (solid)  →  Ghost / icon  →  Plain text
Most important       Supporting       Least important
```

## Correct Example — Workspace Toolbar

```tsx
{/* Most important: solid primary */}
<button className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-bold hover:bg-primary-dark">
  AI Analyze
</button>

{/* Supporting: ghost icon */}
<button className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md">
  <RefreshCw className="w-4 h-4" />
</button>

{/* Least important: plain text */}
<button className="text-slate-500 hover:text-slate-700 text-sm">
  Run again
</button>
```

## The Anti-Pattern to Avoid

```tsx
{/* Three buttons with identical bg-primary/10 styling = no hierarchy */}
<button className="bg-primary/10 text-primary border border-primary/20">AI Analyze</button>
<button className="bg-primary/10 text-primary border border-primary/20">Refresh</button>
<button className="bg-primary/10 text-primary border border-primary/20">Done</button>
```

When everything looks equally important, nothing is.

## When Soft Accent (`bg-primary/10`) Is Appropriate

Use soft accent only when:
- It's the **only** button in its group, OR
- It needs to signal "primary brand" at low visual weight (e.g. a chip or filter toggle that is active)

Never use it for the main CTA in a toolbar or form where there are also secondary actions.

## Decision Checklist

Before styling a button, ask:
1. Is this the most important action the user should take? → **Solid primary**
2. Is this a supporting action alongside a primary CTA? → **Ghost or plain text**
3. Is this an icon-only toolbar control? → **Ghost** (`p-1.5 hover:bg-slate-100`)
4. Is this a low-stakes / escape action (Cancel, Run again)? → **Plain text**
