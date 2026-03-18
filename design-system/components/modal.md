# Modal

**Sources:**
- `src/components/projects/NewProjectModal.tsx`
- `src/components/builder/PromptModal.tsx`
- `src/components/publish/PublishModal.tsx`
- `src/components/builder/QuoteEditModal.tsx`

## Shell

```tsx
{/* Backdrop */}
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
  {/* Panel */}
  <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg mx-4">
    ...
  </div>
</div>
```

## Header Pattern

```tsx
<div className="flex items-center gap-3 p-6 border-b border-slate-100">
  {/* Icon in tinted square */}
  <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
    <SomeIcon className="w-5 h-5" />
  </div>
  <div>
    <h2 className="font-display text-lg font-semibold text-slate-900">Modal Title</h2>
    <p className="text-sm text-slate-500">Optional subtitle</p>
  </div>
</div>
```

## Footer Pattern

```tsx
<div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100">
  <button className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors cursor-pointer">
    Cancel
  </button>
  <button className="px-4 py-2 text-sm font-bold bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors cursor-pointer">
    Confirm
  </button>
</div>
```

## Sizes

| Size | `max-w` class | Use case |
|------|-------------|----------|
| Small | `max-w-sm` | Confirmation dialogs |
| Medium | `max-w-lg` | Standard modals (default) |
| Large | `max-w-2xl` | Multi-step modals (NewProjectModal) |

## Usage

**Do** — use `rounded-2xl` for the modal panel.
**Do** — close on backdrop click and Escape key.
**Don't** — nest a modal inside another modal.

## Accessibility

- Focus must be trapped inside the modal while open.
- First focusable element receives focus on open.
- `role="dialog"` and `aria-modal="true"` on the panel.
- `aria-labelledby` pointing to the modal title `<h2>`.
- Escape key closes the modal.
