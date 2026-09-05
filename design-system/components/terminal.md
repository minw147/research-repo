# Terminal (Agent Runner)

**Source:** `src/components/builder/AgentRunner.tsx`

The Agent Runner terminal displays streaming output from CLI agent runs. **As of the Mint Leaf redesign, the terminal is light-themed, not dark** — the canvas dropped the "one dark surface" convention entirely. There is currently no intentionally-dark surface anywhere in the app; see `patterns/dark-mode.md`.

## Palette

| Element | Class / Value |
|---------|--------------|
| Header bar ("Agent output") | `bg-stone-100 text-stone-600` |
| Log body background | `bg-stone-50` |
| Borders | `border-stone-200` |
| Tool-call lines | `text-ochre-600` |
| Agent text / success | `text-stone-700` |
| Error / stderr | `text-red-700` |
| Info (e.g. "Stopped.") | `text-stone-400 italic` |
| Running indicator | `text-primary` (sage dot + "Running…") |
| Stop button | `border-red-700/40 text-red-700 hover:bg-red-700/10` |
| "Run in Agent" button | `bg-clay-600 text-white` (the CTA color, not sage) |
| Settings-panel background | `bg-stone-100`, inputs `bg-white border-stone-300` |

## Layout

```tsx
{/* Header bar */}
<div className="bg-stone-100 px-3.5 py-2 text-[11px] font-semibold text-stone-600 flex justify-between items-center">
  <span>Agent output</span>
</div>

{/* Log body */}
<div className="bg-stone-50 font-mono text-[11.5px] leading-relaxed p-3 max-h-48 overflow-y-auto">
  {logLines.map(...)}
</div>
```

## Log Entry Types

| Kind | Color |
|------|-------|
| `text` (agent response) | `text-stone-700` |
| `tool` (tool call) | icon `text-ochre-600`, name `text-ochre-600`, summary `text-stone-400` |
| `stderr` | `text-red-700` |
| `info` | `text-stone-400 italic` |

## Controls row

The always-visible bottom row (Run button, settings gear, side actions) sits on `bg-white`, not a tinted surface — this is a genuine full-white bar, distinct from the stone-100 header above it.

## Usage

**Don't** — reintroduce `midnight-ink`, amber, or any dark surface here — the terminal is light now, matching the rest of the app.
**Don't** — use `bg-primary` for the "Run in Agent" button — it's clay, matching every other primary CTA in the system.
**Do** — keep the header (`bg-stone-100`) visually distinct from the log body (`bg-stone-50`) — two adjacent warm neutrals, not one flat surface.
