# AI Analysis: Other Templates Tab — Design

**Date:** 2025-03-08  
**Status:** Draft — awaiting approval

## Goal

Add a third tab/card "Other templates" to the AI Analysis modal on the **Findings** and **Tags** pages. This tab exposes reusable prompt templates for common auxiliary tasks (formatting, research questions, notes integration, etc.) that don't fit the primary actions (Initial Findings, Refine Findings, Tag Findings, Tag Transcripts).

## Scope

- **Findings modal:** Initial Findings | Refine Findings | **Other templates**
- **Tags modal:** Tag Findings | Tag Transcripts | **Other templates**
- **Report modal:** AI synthesis | **Other templates**

## Proposed Template Options

Brainstormed options for "Other templates", prioritized by frequency and value:

### Tier 1 (Must-have)

| Template | Description | Target file | Prompt behavior |
|----------|-------------|-------------|-----------------|
| **Streamline markdown** | Fix inconsistencies: heading levels, list formatting, quote line format. Preserve content. | findings.md or tags.md | Read current file, output cleaned version. Reference SKILL.md quote format. |
| **Add research question** | Incorporate a new research question into findings. User can type the question in a small input or it's a placeholder in the prompt. | findings.md | Read findings + transcripts, add a new theme/section addressing the question. |
| **Review notes and modify** | AI reads a user-specified notes file and merges/incorporates it into findings. | findings.md | Prompt includes `Read [path] and incorporate insights into findings.md`. Path could be editable in prompt or passed as placeholder. |

### Tier 2 (Nice-to-have)

| Template | Description | Target file |
|----------|-------------|-------------|
| **Reorganize themes** | Merge similar sections, split large ones, reorder for clarity. | findings.md |
| **Add participant/session table** | Insert a markdown table summarizing participants, sessions, context. | findings.md |
| **Fix quote format** | Ensure all quote lines match SKILL.md format (timestamp, duration, session, tags). | findings.md or tags.md |
| **Condense findings** | Shorten findings while keeping key insights and quotes. | findings.md |

### Tier 3 (Future)

| Template | Description |
|----------|-------------|
| **Extract from transcript section** | User specifies time range; AI extracts insights from that segment only. |
| **Add recommendations** | Append an "Recommendations" section based on findings. |

## UX Flow

### Option A: Template chips (recommended)

1. User selects **Other templates** card.
2. Below the cards, a "Choose a template" section appears with clickable chips/buttons.
3. Each chip shows template name + short description.
4. Clicking a chip populates the prompt textarea with the corresponding prompt (project context + task).
5. User can edit the prompt before copying (e.g., fill in the notes file path, research question).
6. Copy button and "How it works" text behave as today.

**Pros:** Simple, discoverable, no extra modal.  
**Cons:** Many templates could clutter; solve with scroll or "Show more."

### Option B: Nested dropdown

1. User selects **Other templates**.
2. A dropdown appears: "Select template" → Streamline markdown, Add research question, etc.
3. Selecting one populates the textarea.

**Pros:** Compact.  
**Cons:** Extra click, less discoverable.

### Option C: Sub-tabs under Other templates

1. Other templates opens a second row of tabs: Streamline | Add question | Review notes | …
2. Each sub-tab has its own generated prompt.

**Pros:** Clear separation.  
**Cons:** More UI complexity, may feel heavy.

**Recommendation:** Option A (template chips). Start with 4–5 chips; add more over time. Use a compact chip layout consistent with the design system.

## Implementation Summary

### Data model

- Add `AIAction`: `"other-templates"` (or `"custom"`).
- For `other-templates`, the "prompt" is not from a single builder; it comes from the selected template.

### New prompt builders in `prompts.ts`

```ts
// e.g.
buildStreamlineMarkdownPrompt(project, "findings" | "tags")
buildAddResearchQuestionPrompt(project, question?: string)  // question optional, user edits in prompt
buildReviewNotesAndModifyPrompt(project, notesPath: string)  // path placeholder, user fills
buildReorganizeThemesPrompt(project)
buildAddParticipantTablePrompt(project)
buildFixQuoteFormatPrompt(project, "findings" | "tags")
```

### UI changes

1. **PromptModal**
   - Add `other-templates` to `aiActions` when on Findings or Tags (via `actions` prop).
   - When `selectedAction === "other-templates"`:
     - Render template chips below the main cards.
     - Track `selectedTemplateId` (e.g. `"streamline"`, `"add-question"`, `"review-notes"`).
     - `generatePrompt()` returns the result of the corresponding builder.
   - `getTargetFile("other-templates")` → depends on template; most map to `findings.md` or `tags.md`.

2. **DocumentWorkspace**
   - Extend `aiActions` to include `"other-templates"` for both `findings.md` and `tags.md`.
   - `initialAIAction` stays as first primary action (not other-templates).

### Template-specific behavior

- **Streamline markdown:** Generic prompt; no user input. Target = current file (findings or tags).
- **Add research question:** Prompt has placeholder `[RESEARCH_QUESTION]`; user edits before copy. No separate input—placeholder in prompt is sufficient.
- **Review notes and modify:** Prompt has placeholder `[NOTES_FILE_PATH]` (e.g. `notes/study-notes.md`). User edits before copy.

## Design System Alignment

- Template chips: same compact style as action cards (`rounded-lg`, `border`, `hover`, `primary` when selected).
- No new modals; keep AI Analysis modal as single surface.
- "How it works" text: when other-templates, mention that the prompt references the Research Analysis skill and that the target file depends on the template.

## Decisions

- **Report modal:** Include Other templates (same as Findings and Tags).
- **User inputs:** Placeholder-in-prompt is sufficient; no separate form fields.
- **Initial selection:** When user opens Other templates, no default template—textarea stays empty until they pick one (or show first template as default; TBD during implementation).

## Acceptance Criteria

- [ ] Findings modal shows three cards: Initial Findings, Refine Findings, Other templates.
- [ ] Tags modal shows three cards: Tag Findings, Tag Transcripts, Other templates.
- [ ] Selecting Other templates reveals template chips (at least: Streamline, Add research question, Review notes).
- [ ] Clicking a chip populates the prompt textarea with the correct prompt.
- [ ] User can edit the prompt before copying.
- [ ] Copy and Done behave as today.
- [ ] All templates reference `.cursor/skills/research-analysis/SKILL.md` where relevant.
