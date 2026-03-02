# Product Requirements Document (PRD)
**Project Name:** Local-First Research Repository (Dovetail Alternative)
**Status:** Phase 1 (MVP) Planning
**Primary Tech Stack:** Next.js, GitHub Enterprise (Pages), SharePoint, Cursor

## 1. Executive Summary & Vision
We are building a lightweight, zero-subscription alternative to Dovetail/Condens. 
Instead of relying on a SaaS backend and external LLM APIs, this tool leverages **Cursor** as the local AI analysis engine and **Git** as the database. Video assets are securely hosted on corporate **SharePoint/OneDrive**, and the frontend is a statically exported Next.js app hosted securely on **GitHub Enterprise Pages**. 

This approach ensures absolute data privacy, zero recurring software costs, and full IT compliance, while laying the groundwork to upgrade to a dynamic web app (Vercel) in the future.

---

## 2. Target Audience & User Roles
*   **Researchers (Editors):** Run the app locally, drop raw transcripts into the codebase, and use Cursor (Cmd+I) to analyze data, extract insights, and generate Markdown (MDX) reports. They push to Git to publish.
*   **Stakeholders (Viewers):** Access the deployed GitHub Pages site. They read reports and click video clips, which seamlessly authenticate via their existing Microsoft 365 SSO to play specific interview moments.

---

## 3. Architecture & Tech Stack (Phase 1)
*   **Framework:** Next.js App Router.
*   **Hosting:** GitHub Enterprise Pages (Private Static Export).
*   **Database (CMS):** Local File System (`.json` and `.mdx` files) synced via Git.
*   **AI Engine:** Cursor (running locally against the repo's files).
*   **Video Hosting:** SharePoint / OneDrive.
*   **Video Playback:** "Pre-generated Clip Architecture" (Uses local FFmpeg to slice small clips, hosted alongside reports. Eliminates player complexity, loading spinners, and cross-site cookie issues).

---

## 4. Core Features (Phase 1)
1.  **Research Dashboard:** A searchable/filterable index page listing all past research studies based on metadata (Persona, Date, Product).
2.  **MDX Report Viewer:** A rich-text reading experience for research reports, supporting standard markdown and custom React components.
3.  **Embedded Video Clips:** A `<Clip>` component embedded in reports. Plays lightweight, pre-sliced `.mp4` clips directly in the report for instant playback.
4.  **Cursor-Optimized Architecture:** File structures and a `.cursorrules` file explicitly designed so Cursor can read transcripts and write perfectly formatted reports without human copy-pasting.

---

## 5. Data Schema & File Structure

The project will use a strict, flat file structure so Cursor can easily map metadata to transcripts.

### Directory Structure
```text
/my-research-repo
├── /public                   # Static assets
│   └── /videos               # Local dummy videos for development
├── /data
│   ├── /transcripts          # Raw text files (e.g., study-001-user-A.txt)
│   └── research-index.json   # Global metadata database
├── /content
│   └── /reports              # Final output written by Cursor (.mdx)
├── /components               # React components (Clip, Layout, etc.)
├── /lib                      # Data fetching logic (Future-proofed)
├── next.config.mjs           # Next.js export settings
└── .cursorrules              # AI System Prompt
```

### Metadata Schema (`/data/research-index.json`)
```json
[
  {
    "id": "study-001",
    "title": "Q1 Navigation Overhaul",
    "date": "2023-10-27",
    "persona": "Power User",
    "product": "Mobile App",
    "videoUrl": "https://1drv.ms/v/s!Abc123xyz789/E", # OneDrive link for dev
    "transcriptFile": "study-001-user-A.txt",
    "reportFile": "q1-nav-overhaul.mdx"
  }
]
```

### The AI Prompt (`.cursorrules`)
*Must be placed in the root directory.*
```markdown
You are a UX Research Assistant.
1. Read transcripts from /data/transcripts.
2. Write final reports in /content/reports using MDX format.
3. Fetch video URLs from /data/research-index.json.
4. To embed video evidence, ALWAYS use the Clip component:
   <Clip url="SHAREPOINT_URL" start={SECONDS} label="Exact quote here" />
5. Convert all timestamps (e.g., 01:30) to total seconds (e.g., 90).
```

---

## 6. Phase 1 Implementation Steps

**Step 1: Future-Proof Next.js Configuration**
Configure Next.js to support both GitHub Pages (now) and Vercel (later).
*File: `next.config.mjs`*
```javascript
const isGithubActions = process.env.GITHUB_ACTIONS || false;
export default {
  output: isGithubActions ? 'export' : undefined,
  basePath: isGithubActions ? '/my-research-repo' : '',
  images: { unoptimized: true },
};
```

**Step 2: Build the Data Abstraction Layer**
Create `/lib/db.js`. For Phase 1, write functions that read from `/data/research-index.json`. 
*Why: In Phase 2, we will swap these functions to call a real database without rewriting the UI.*

**Step 3: Build the Simple Clip Component**
Create `/components/Clip.js` to render standard HTML5 video.
```javascript
export default function Clip({ src, label }) {
  return (
    <div className="my-6 border-l-4 border-blue-500 pl-4">
      <p className="font-semibold text-gray-800 mb-2">"{label}"</p>
      <video controls className="w-full max-w-2xl rounded shadow-lg bg-black" preload="metadata">
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
```

**Step 4: Automate Deployment**
Create `.github/workflows/deploy.yml` to trigger a static Next.js build and push to GitHub Pages whenever code is pushed to the `main` branch.

**Step 5: The FFmpeg Workflow**
Since you have FFmpeg installed, you will use it to slice clips locally before pushing.
Command: `ffmpeg -i full.mp4 -ss [START] -t [DURATION] -c copy [OUTPUT_NAME].mp4`
*   `-ss 00:04:30`: Start time
*   `-t 00:00:15`: Duration (15 seconds)
*   `-c copy`: Instant processing (no re-encoding)

---

## 7. User Workflows

### The Analyst Workflow (Researcher)
1.  Download transcript and video from Zoom/Teams.
2.  Open project in Cursor. Open Composer (Cmd+I) and prompt: *"Analyze transcript. Identify top 3 pain points with timestamps."*
3.  **Generate Clips:** Use FFmpeg locally to slice the 3 clips: `ffmpeg -i full.mp4 -ss 00:04:30 -t 15 -c copy clip1.mp4`.
4.  Add clips to `/public/videos` (or upload to SharePoint and reference URL).
5.  Prompt Cursor: *"Write report in `/reports` embedding these 3 clips."*
6.  Type `git push` to publish.

### The Viewer Workflow (Stakeholder)
1.  Navigate to the secure GitHub Pages URL.
2.  Read the report.
3.  Watch clips instantly (embedded standard HTML5 player). No pop-outs, no login loops.

---

## 8. Next Phase Features (Vercel & Dynamic DB)

To prepare for future funding or infrastructure changes, the application is designed to smoothly transition to **Vercel**. Transitioning will unlock the following capabilities:

### Feature 1: The "Write-Back" UI (API Routes)
*   **Current Limitation:** GitHub Pages is read-only. Updates require Git.
*   **Next Phase:** Deploying on Vercel unlocks **API Routes**. We will add a feature where stakeholders can highlight text directly in the browser and click "Save Insight." An API route (`POST /api/save-clip`) will write this directly to a database, instantly updating the UI for everyone without needing Git.

### Feature 2: Global Instant Search
*   **Current Limitation:** Static sites require downloading the whole JSON index to search.
*   **Next Phase:** Move transcripts to a database (e.g., Supabase/Postgres). Vercel API routes will allow instant full-text search across all historical transcripts and reports.

### Feature 3: Native Authentication
*   **Current Limitation:** Relies on GitHub Enterprise network security.
*   **Next Phase:** Implement NextAuth (Auth.js) to allow Single Sign-On (Okta/Google/Azure AD) directly into the Next.js app, allowing granular permissions (e.g., "Admin" vs "Viewer").

### Migration Checklist (When moving to Vercel):
1.  Import GitHub Repo to Vercel Dashboard.
2.  Delete `.github/workflows/deploy.yml`.
3.  Ensure `process.env.GITHUB_ACTIONS` is false (happens automatically).
4.  Replace functions in `/lib/db.js` with Database queries. (UI remains untouched).