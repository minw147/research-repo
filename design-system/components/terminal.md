# Terminal (Agent Runner)

**Source:** `src/components/builder/AgentRunner.tsx`

The Agent Runner terminal displays streaming output from CLI agent runs. It uses a warm dark palette — not the default VS Code-style cool blue-slate.

## Palette

| Element | Class / Value |
|---------|--------------|
| Body background | `bg-[#1c1108]` |
| Header / chrome | `bg-[#2a1f0e]` (= `surface-dark` token) |
| Borders | `border-[#4a3520]` (= `border-dark` token) |
| Primary text | `text-amber-50` |
| Muted labels | `text-amber-200/70` |
| Tool output | `text-yellow-400` / `text-yellow-500` |
| Success / agent text | `text-green-300` |
| Error text | `text-red-400` |
| Running indicator | `text-green-400 animate-pulse` |
| Stop button | `border-red-500/50 text-red-400 hover:bg-red-500/10` |

## Layout

```tsx
{/* Header bar */}
<div className="bg-[#2a1f0e] px-3 py-1.5 text-xs text-amber-200/70 flex justify-between items-center border-b border-[#4a3520]">
  <span>Agent output</span>
</div>

{/* Log body */}
<div className="bg-[#1c1108] font-mono text-xs p-3 max-h-48 overflow-y-auto">
  {logLines.map(...)}
</div>
```

## Log Entry Types

| Kind | Color |
|------|-------|
| `text` (agent response) | `text-green-300` |
| `tool` (tool call) | icon `text-yellow-500`, name `text-yellow-400`, summary `text-slate-500` |
| `stderr` | `text-red-400` |
| `info` (e.g. "Stopped.") | `text-slate-500 italic` |

## Settings Panel

When the settings panel is open, it uses `bg-[#2a1f0e]` with `border-[#4a3520]` borders and `text-amber-200/70` labels — matching the terminal chrome, not the light app surface.

## Usage

**Don't** — use `bg-slate-800`, `bg-slate-900`, or any cool-slate class in this component.
**Don't** — use `text-slate-200` for terminal text — use `text-amber-50`.
