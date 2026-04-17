# 🧪 Research Hub: The Local-First Research Powerhouse

Research Hub is a **100% open-source, local-first UX research repository** designed for speed, privacy, and deep AI integration. It’s not just a place to dump transcripts; it’s a living analysis engine that evolves with you.

Built to run alongside [Cursor](https://cursor.com) and [Claude Code](https://claude.ai/code), Research Hub gives you the power of frontier AI models applied directly to your local files—no complex cloud configuration required.

---

## Why Research Hub?

*   **⚡ Local-First, Zero Latency** — Your data lives on your disk as plain JSON and Markdown. It’s fast, searchable, and works 100% offline if you use a local LLM or stick to the deterministic toolchain.
*   **🧠 An Assistant That Learns** — The built-in AI Assistant isn't a static bot. Through `researcher.md`, it learns your methodology, documents your research habits, and adapts to your personal style. It gets smarter the more you use it.
*   **🛠️ Deep IDE Integration** — Because it hooks directly into Cursor and Claude Code, the assistant can use **any skill or plugin** you already have installed. It’s a seamless bridge between your research data and your development environment.
*   **🎨 WYSIWYG + Markdown** — Write in a beautiful, formatted editor (Tiptap) while maintaining a clean, portable GFM Markdown source. Drop quote cards directly into your prose—they're atomic, indestructible, and link straight to the video.
*   **🔗 Deterministic Reports** — Skip the AI and "Build HTML" instantly from your findings. You get a beautiful, interactive report with embedded video clips and styled callouts in one click. Want more? Use **AI Synthesis** for a high-end, agent-crafted narrative.

---

## The Workflow

1.  **Ingest** — Drop in your video and transcripts (VTT/TXT).
2.  **Tag** — Build a flexible codebook that spans projects or stays hyper-local.
3.  **Analyze** — Use the **AI Analyze** bridge to trigger Cursor/Claude. They’ll read your data, extract verbatim evidence, and update your `findings.md` or `tags.md` in real-time.
4.  **Refine** — Edit in the rich WYSIWYG editor. Drag and drop clips from the sidebar. Everything stays synced.
5.  **Ship** — Click **Build HTML** for an instant report, then **Export** to create a portable folder (with sliced MP4 clips!) you can drop onto a synced SharePoint, OneDrive, or Google Drive.

---

## 🛠️ Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start the engine |
| `npm run build` | Static production export |
| `npm run slice-clips` | Use FFmpeg to extract video evidence automatically |
| `npm run test` | Run the Vitest suite |
| `npm run lint` | Keep the code clean |

---

## 🏗️ Project Structure

Your research is structured to be readable by humans, bots, and browsers alike:

```
research-repo/
├── content/projects/[slug]/   # Your research "Brain"
│   ├── project.json           # Metadata & session index
│   ├── findings.md            # Thematic analysis (GFM)
│   ├── tags.md                # The Tag Board (Evidence)
│   ├── findings.html          # The interactive report
│   ├── export/                # A portable, shareable bundle
│   └── transcripts/           # Verbatim session data
├── researcher.md              # The Assistant's Memory (gitignored)
├── .cursor/skills/            # Pro-grade Research Skills
└── src/                       # Next.js 14 App (App Router)
```

## 🛡️ Privacy & Ownership

Research Hub is **100% Open Source**. You own your data, your codebook, and your assistant's memory. You can configure it to be entirely local, or use cloud-sync adapters for easy sharing. No lock-in, no proprietary formats, just better research.

---

MIT — Crafted with 🧡 for researchers who want more.
