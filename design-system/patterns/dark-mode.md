# Dark Mode

## The app is fully light — no exceptions

There is no dark palette anywhere in the app, and no intentionally-dark surface. The Agent Runner terminal — previously the one dark exception — was reskinned to a light stone theme as part of the Mint Leaf redesign (see [components/terminal.md](../components/terminal.md)). Don't add `dark:` variants to new components, and don't reintroduce a dark terminal.

`darkMode: "class"` may still be declared in `tailwind.config.ts` as leftover scaffolding — check before relying on it for anything; nothing in the app currently uses `dark:` classes.

## Current Coverage

| Component | Status |
|-----------|--------|
| Every component, including `AgentRunner` | ❌ Light-only, by design — no `dark:` variants, no dark surfaces |

## Rules

- **Don't** add `dark:` variants to new components.
- **Don't** invent a dark surface anywhere, including a terminal or console. If something historically needed to "look like a terminal," it's now light (`bg-stone-50` body, `bg-stone-100` chrome) — see [components/terminal.md](../components/terminal.md).
- **Don't** use `midnight-ink`, amber tokens, or any hardcoded dark hex — they were retired when the terminal moved to the light theme.
- If you find a stray `dark:` class or a dark surface anywhere, it's a leftover from a prior design pass — flatten it to the current light tokens.
