# Design: Add Sessions to Report Builder

**Date:** 2026-03-08
**Status:** Approved
**Topic:** Adding a modal/feature to upload/register session recordings and transcripts.

---

## 1. Overview
The Report Builder currently requires manual filesystem operations and JSON editing to add research sessions to a project. This design introduces a dual approach ("Parity") to allow researchers to add sessions either through the UI (browser) or through the IDE/CLI (Cursor/Claude Code).

## 2. Goals
- Provide a clear in-app flow for uploading/registering sessions.
- Maintain the local-first, filesystem-based architecture.
- Ensure the `research-analysis` skill and the UI provide consistent instructions and produce the same data state.
- Handle empty states gracefully by guiding users toward adding their first session.

## 3. Design Sections

### 3.1 Empty State (Findings Page)
When a project has no sessions (`sessions.length === 0`), the Findings page will display a dedicated empty state instead of an empty video player.

- **Title:** "No sessions yet"
- **Primary Action:** "Add Session" button (opens a modal).
- **Guidance:** A secondary message: *"Or use the **research-analysis** skill in your IDE to add video and transcript files and register sessions."*
- **Path Hint:** Show the project folder path: `content/projects/<slug>/`.

### 3.2 UI: "Add Session" Modal
A new modal component will handle session registration.

- **Inputs:**
  - **Participant Name:** (e.g., "User 1", "Alex")
  - **Video File:** File upload (or selection if already in folder). Writes to `content/projects/{slug}/videos/`.
  - **Transcript File:** File upload for `.txt` transcripts. Writes to `content/projects/{slug}/transcripts/`.
  - **Alternative:** "I'll add transcripts later" (sets `transcriptFile` to an empty string or placeholder).
- **Action:** 
  - Save files to the appropriate subdirectories.
  - Append a new session object to `project.json`:
    ```json
    {
      "id": "session-unique-id",
      "participant": "Name",
      "videoFile": "filename.mp4",
      "transcriptFile": "filename.txt"
    }
    ```
- **Post-Submission:** Trigger a project data refresh so the new session appears in the dropdown.

### 3.3 IDE / Skill Path (Parity)
Update the `research-analysis` skill to explicitly support adding sessions to a Report Builder project.

- **Instructions:**
  1. Move recordings to `content/projects/{slug}/videos/`.
  2. Move transcripts to `content/projects/{slug}/transcripts/`.
  3. Update `project.json` to include the new session(s) in the `sessions` array.
- **Support:** If the user is in Cursor, they can simply ask the AI to "Add session 'User A' using video.mp4 and transcript.txt," and the AI should follow these steps.

### 3.4 Data Contract
Both paths must adhere to the same schema:
- **Project Folder:** `content/projects/{slug}/`
- **Subfolders:** `videos/`, `transcripts/`
- **Metadata:** `project.json` (specifically the `sessions` array).

---

## 4. Implementation Details

### 4.1 UI Components
- `AddSessionModal.tsx`: Form for participant name and file uploads.
- `ProjectEmptyState.tsx`: Reusable empty state component for the builder pages.

### 4.2 API Routes
- `POST /api/projects/[slug]/sessions`: A new endpoint to handle file saving and `project.json` updates in a single transaction.

### 4.3 Skill Update
- Modify `.cursor/skills/research-analysis/SKILL.md` to include the Report Builder folder structure and session registration steps.

---

## 5. Testing Plan
- **UI Test:** Open a new project -> see empty state -> click "Add Session" -> upload files -> verify session appears in dropdown and files are on disk.
- **Skill Test:** Use Cursor to "add a session" -> verify AI places files correctly and updates `project.json` -> refresh UI to confirm it loads.
- **Validation:** Ensure duplicate session IDs or missing files are handled gracefully with error messages.
