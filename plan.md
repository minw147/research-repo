This is the comprehensive, step-by-step build plan for the **Local-First Research Repository**.

This plan is designed to be executed by a non-thinking agent. It breaks down the PRD into 5 discrete phases with clear instructions and specific skill usage.

---

# Build Plan: Local-First Research Repository

## Phase 1: Environment & Framework Setup
**Goal:** Initialize a clean Next.js 14+ project optimized for static export and local AI analysis.
**Key Skill:** `web-frameworks` (Next.js App Router patterns)

1.  **Initialize Project**
    *   Create a new Next.js app in the root directory:
        ```bash
        npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
        ```
    *   *Constraint:* Ensure `package.json` has `"name": "research-repo"`.

2.  **Configure for Static Export (GitHub Pages)**
    *   Update `next.config.mjs`:
        ```javascript
        const isGithubActions = process.env.GITHUB_ACTIONS || false;
        /** @type {import('next').NextConfig} */
        const nextConfig = {
          output: 'export',
          basePath: isGithubActions ? '/research-repo' : '',
          images: { unoptimized: true },
        };
        export default nextConfig;
        ```

3.  **Install Dependencies**
    *   Run: `npm install lucide-react date-fns gray-matter remark remark-html`
    *   *Note:* `lucide-react` is for UI icons, `gray-matter` for parsing frontmatter.

4.  **Create Directory Structure**
    *   Delete `src/app/page.tsx` (we will rebuild it).
    *   Create these folders:
        *   `src/components` (UI parts)
        *   `src/lib` (Logic)
        *   `data/transcripts` (Raw text)
        *   `content/reports` (MDX output)
        *   `public/videos` (Local clips)

5.  **Commit Initial Setup**
    *   `git add . && git commit -m "Phase 1: Project scaffold and config"`

---

## Phase 2: Design System & UI Foundation
**Goal:** Implement a polished, professional UI matching the "Stitch" mockups.
**Key Skill:** `ui-ux-pro-max` (Professional styling & components)

1.  **Analyze Mockups**
    *   *Reference:* `stitch-screens/README.md` and the downloaded PNGs.
    *   *Task:* Identify the "Stitch" color palette (likely clean whites, soft grays, and a primary blue accent) and typography (Inter/Sans).

2.  **Setup Tailwind Config**
    *   Update `tailwind.config.ts` to include custom colors extracted from the mockups (e.g., `primary: '#0052CC'`, `bg-subtle: '#F4F5F7'`).
    *   Add `typography` plugin if needed: `npm install -D @tailwindcss/typography`.

3.  **Create Core Layout**
    *   Create `src/components/Layout.tsx`:
        *   **Sidebar:** Navigation links (Dashboard, Reports, Search).
        *   **Header:** Breadcrumbs and "User" avatar (static).
        *   **Main Content Area:** Centered container with `max-w-7xl`.
    *   *Skill usage:* Use `ui-ux-pro-max` to ensure accessible contrast and proper spacing (8px grid).

4.  **Create `Clip` Component (The Core Feature)**
    *   Create `src/components/Clip.tsx`:
        *   Props: `src` (string), `label` (string), `timestampUrl` (optional string for dev).
        *   Logic: If `src` is provided, render `<video controls src={src} />`.
        *   Styling: Rounded corners, subtle shadow, "Play" icon overlay.
    *   *Validation:* Ensure it looks like the "Interactive Video Clip" component in the Stitch mockup.

---

## Phase 3: Data Layer & Logic
**Goal:** Build the local file-system database that Cursor will interact with.
**Key Skill:** `backend-development` (Data structure design)

1.  **Create Metadata Database**
    *   Create `data/research-index.json` with dummy data:
        ```json
        [
          {
            "id": "study-001",
            "title": "Checkout Flow Usability",
            "date": "2024-03-15",
            "persona": "New Customer",
            "videoUrl": "https://1drv.ms/v/s!Example",
            "reportFile": "checkout-flow.mdx"
          }
        ]
        ```

2.  **Build Data Access Layer**
    *   Create `src/lib/db.ts`:
        *   `getAllStudies()`: Reads and parses `data/research-index.json`.
        *   `getStudyById(id)`: Returns specific study metadata.
        *   `getReportContent(filename)`: Reads `content/reports/[filename]`, parses frontmatter using `gray-matter`.

3.  **Type Definitions**
    *   Create `src/types/index.ts` defining `Study`, `Report`, and `Clip` interfaces to ensure type safety.

---

## Phase 4: Page Implementation
**Goal:** Build the actual pages (Dashboard and Report View) using the data layer.
**Key Skill:** `frontend-development` (React components & routing)

1.  **Dashboard Page (`/`)**
    *   Create `src/app/page.tsx`.
    *   Fetch studies using `getAllStudies()`.
    *   Render a grid of "Study Cards" (Title, Date, Persona tags).
    *   *Style:* Match "Research Repository Dashboard" mockup (clean cards, filter bar at top).

2.  **Report View Page (`/reports/[slug]`)**
    *   Create `src/app/reports/[slug]/page.tsx` (Dynamic Route).
    *   Fetch report content using `getReportContent`.
    *   Render Markdown content.
    *   **Crucial:** Map the custom `<Clip />` component so it renders inside the MDX.
    *   *Style:* Match "Research Study Report View" mockup (typography focused, clear headings).

3.  **Search/Filter Logic**
    *   Add client-side filtering to the Dashboard (filter by Persona or Date).

---

## Phase 5: "Cursor-First" Optimization & Workflows
**Goal:** Configure the repo so the *User* (Researcher) can use Cursor to generate content effortlessly.
**Key Skill:** `context-engineering` (System prompts)

1.  **Create `.cursorrules`**
    *   Create the system prompt file in the root:
        ```markdown
        You are a UX Research Assistant.
        1. When asked to "Analyze", read text from `data/transcripts`.
        2. When writing reports, ALWAYS save to `content/reports` as MDX.
        3. ALWAYS use the `<Clip src="..." label="..." />` component for quotes.
        4. NEVER output raw video timestamps; convert them to Clip components.
        ```

2.  **Create Local Dev Assets**
    *   Create `public/videos/demo-clip.mp4` (Use a tiny placeholder or the user's FFmpeg generated clip).
    *   Update `data/research-index.json` to point to this local clip for testing.

3.  **Add `.gitignore` Rules**
    *   Add `raw_videos/` and `*.mov` / `*.mkv` to `.gitignore` to prevent bloating the repo.
    *   Allow `public/videos/*.mp4` (assuming they are small clips).

---

## Final Review & Handover
1.  **Run `npm run build`** to verify static export works.
2.  **Run `npm run dev`** and click through the flow: Dashboard -> Report -> Play Clip.
3.  **Check Lints:** Run `npm run lint` and fix any issues.

This plan moves from infrastructure -> visual design -> logic -> content -> AI optimization, ensuring a robust, scalable, and "beautiful" result.