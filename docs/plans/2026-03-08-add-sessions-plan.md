# Implementation Plan: Add Sessions to Report Builder

**Date:** 2026-03-08
**Status:** Draft
**Design Doc:** `docs/plans/2026-03-08-add-sessions-design.md`

---

## Overview
This plan implements a dual-path ("Parity") system for adding research sessions to projects. It includes a UI flow (modal + API) and a documented/scriptable flow for the AI IDE.

---

## Phase 1: API & Library Support

### Task 1.1: Add `POST /api/projects/[slug]/sessions`
- **Objective:** Provide a secure endpoint to upload video/transcript files and update `project.json`.
- **Requirements:**
  - Authenticate the `slug`.
  - Save video file to `content/projects/{slug}/videos/`.
  - Save transcript file to `content/projects/{slug}/transcripts/`.
  - Append a new `Session` object to `project.json` using `updateProject` (from `src/lib/projects.ts`).
  - Handle `multipart/form-data` for file uploads.
- **TDD:**
  - Test successful upload: 200 OK, files on disk, `project.json` updated.
  - Test invalid slug or missing files: 400 Error.

---

## Phase 2: UI Implementation

### Task 2.1: Create `ProjectEmptyState` Component
- **Objective:** Provide a clear call-to-action when no sessions exist.
- **Location:** `src/components/projects/ProjectEmptyState.tsx`.
- **Props:** `slug: string`, `onAddSession: () => void`.
- **UI:** 
  - Centralized layout.
  - Primary button: "Add Session".
  - Text: "Or use the research-analysis skill in your IDE to add files and register sessions."
  - Folder path hint.

### Task 2.2: Create `AddSessionModal` Component
- **Objective:** Form-driven session registration.
- **Location:** `src/components/projects/AddSessionModal.tsx`.
- **Inputs:** Participant name, Video file picker, Transcript file picker.
- **Logic:** 
  - Use `FormData` to POST to `/api/projects/[slug]/sessions`.
  - Show progress/loading states.
  - Trigger `onSuccess` callback to refresh project state.

### Task 2.3: Integrate Empty State into Findings Page
- **Objective:** Show the empty state instead of the player when `sessions.length === 0`.
- **Location:** `src/app/builder/[slug]/findings/page.tsx`.
- **Logic:** 
  - Check `project.sessions.length`.
  - Render `ProjectEmptyState` if 0.
  - Open `AddSessionModal` on click.

---

## Phase 3: Skill & Documentation Update

### Task 3.1: Update `research-analysis` Skill
- **Objective:** Align the IDE skill with the Report Builder project structure.
- **File:** `.cursor/skills/research-analysis/SKILL.md`.
- **Changes:**
  - Add a "Report Builder Projects" section.
  - Detail file paths: `content/projects/{slug}/videos/` and `transcripts/`.
  - Detail `project.json` session object schema.
  - Instructions for AI to automate these steps.

---

## Phase 4: Verification

### Task 4.1: Manual & Automated Verification
- Verify the UI flow from a fresh project.
- Verify the IDE flow by asking Cursor to add a session.
- Run existing lints and tests to ensure no regressions.
