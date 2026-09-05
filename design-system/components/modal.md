# Modal

**Sources:**
- `src/components/projects/NewProjectModal.tsx`
- `src/components/builder/PromptModal.tsx`
- `src/components/publish/PublishModal.tsx`
- `src/components/builder/QuoteEditModal.tsx`

## Shell

```tsx
{/* Backdrop */}
<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
  {/* Panel */}
  <div className="bg-white rounded-md border border-stone-200 shadow-dialog w-full max-w-lg mx-4">
    ...
  </div>
</div>
```

## Header Pattern

```tsx
<div className="flex items-center justify-between px-4 py-2.5 border-b border-stone-200 bg-stone-100/50">
  <div className="flex items-center gap-2">
    {/* Icon in tinted square — ALWAYS clay, regardless of modal subject */}
    <div className="p-1.5 bg-clay-600/10 rounded text-clay-600">
      <SomeIcon className="w-4 h-4" />
    </div>
    <h2 className="font-serif font-semibold text-stone-900">Modal Title</h2>
  </div>
  <button aria-label="Close" className="text-stone-400 hover:text-stone-900 p-1 rounded-md hover:bg-stone-100">
    <X className="w-5 h-5" />
  </button>
</div>
```

## Footer Pattern

```tsx
<div className="flex items-center justify-end gap-3 px-4 py-2.5 border-t border-stone-200 bg-stone-100/50">
  <button className="px-4 py-2 text-sm text-stone-600 hover:text-stone-900 transition-colors cursor-pointer">
    Cancel
  </button>
  <button className="px-4 py-2 text-sm font-medium bg-clay-600 text-white rounded hover:opacity-90 transition-opacity cursor-pointer">
    Confirm
  </button>
</div>
```

The confirm/submit button in every modal in this app is **clay**, not sage — this is the one place the CTA rule is most consistent (New Project → Create Project, AI Analyze → Run in Agent, Publish → Publish Report).

## Sizes

| Size | `max-w` class | Use case |
|------|-------------|----------|
| Small | `max-w-sm` | Confirmation dialogs |
| Medium | `max-w-lg` | Standard modals (default) |
| Large | `max-w-2xl` | Multi-step modals (NewProjectModal, PromptModal) |

## Usage

**Do** — use `rounded-md` (8px) for the modal panel.
**Do** — use `shadow-dialog` on the panel — the one shadow token, reserved for modals and floating popovers.
**Do** — use `bg-stone-100/50` for header/footer bars, `bg-white` for the body.
**Do** — form inputs inside modals use `border-stone-300` (not `stone-200` — that's for hairlines/dividers).
**Do** — close on backdrop click and Escape key.
**Don't** — nest a modal inside another modal.

## Accessibility

- Focus must be trapped inside the modal while open.
- First focusable element receives focus on open.
- `role="dialog"` and `aria-modal="true"` on the panel.
- `aria-labelledby` pointing to the modal title `<h2>`.
- Escape key closes the modal.
