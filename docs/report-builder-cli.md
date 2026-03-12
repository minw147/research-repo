# Report Builder: AI Analysis workflow

The Report Builder uses a **copy-and-run** workflow for AI analysis. The app generates prompts; you paste them into Cursor (or another AI-powered IDE) and run the agent there. The AI edits project files directly. You then refresh the app to see the updated documents.

## How it works

1. **Open AI Analysis** — In the Findings, Tags, or Report page, click **AI Analyze**.
2. **Choose an action** — Select what you want (e.g. Initial Findings, Tag Findings, AI synthesis).
3. **Copy the prompt** — Click **Copy** to copy the generated prompt to your clipboard.
4. **Run in your IDE** — Paste the prompt into Cursor and run the agent. The AI will read project files and create or update markdown.
5. **Refresh** — Return to the Report Builder and use the Refresh button (or wait for file-watch) to see the changes.

## Target files

Each action updates a specific file under `content/projects/[slug]/`:

| Action | Target file |
|--------|-------------|
| Initial Findings | `findings.md` |
| Refine Findings | `findings.md` |
| Tag Findings | `tags.md` |
| Tag Transcripts | `tags.md` |
| AI synthesis | `report.mdx` |

## Tips

- Ensure your repo is opened in Cursor with the project directory (`content/projects/[slug]/`) visible so the AI can read transcripts and existing findings.
- The prompts reference `.cursor/skills/research-analysis/SKILL.md` and `.cursor/skills/report-publication/SKILL.md` for format and structure. Keep those skills in the repo.
- If the app doesn’t show changes after the AI runs, click the Refresh button to re-fetch the file from disk.
