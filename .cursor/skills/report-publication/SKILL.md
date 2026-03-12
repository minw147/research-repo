---
name: report-publication
description: Generate beautifully formatted HTML research reports from findings.md. Use when the researcher says the report is ready. Converts findings into findings.html, complete with styling, info panels, pseudo-video clips, and /ui-ux-pro-max aesthetic principles.
---

# Report Publication

Publish HTML research reports to `content/projects/[slug]/findings.html`.

This skill shifts away from generating basic Markdown/MDX files and instead relies on the /ui-ux-pro-max aesthetic to generate highly customized, engaging HTML pages directly from research findings. 

## The Workflow (Steps to Execute)

### Step 1: Read the Findings
- Read the findings from `content/projects/[slug]/findings.md`. 
- Understand the core themes, the tone of the insights, and the key quotes (which include timestamps in the format `@ MM:SS (SECONDSs) | duration: XXs | session: X`).

### Step 2: Apply `/ui-ux-pro-max` Formatting & Design
- Create an ambitious, premium HTML structure for the report.
- Bring the findings to life by not just performing a simple rewrite, but proactively adding **information panels, callouts, data tables, emojis**, and beautiful typographic hierarchy.
- Use inline CSS or assumed global utilities to ensure the report looks spectacular, readable, scannable, and modern (e.g., using gradients, glassmorphism, nice shadows).
- **Never use dark backgrounds**—header, recommendations, or any section. Use light surfaces with borders, accents, or subtle tints for hierarchy.

### Step 3: Embed Pseudo-Video Clips
- For every exact quote found in `findings.md` that acts as evidence, replace it with a **pseudo-video clip player**.
- Do not build quote cards. You must insert an actual HTML `<video>` element with controls that load the original full session video but play ONLY the excerpted duration.
- **Video source URL pattern:** Use the project file API. The prompt will provide the project slug and video file names from `project.json` (sessions[].videoFile). Build the video URL as:
  ```
  /api/projects/[SLUG]/files/videos/[VIDEO_FILE]
  ```
  Example: For slug `my-study` and session 1 video file `session-1.mp4`:
  ```
  /api/projects/my-study/files/videos/session-1.mp4
  ```
- **Do not slice the video.** Use the full video file; constrain playback with `#t=start,end` in the URL.
- Example video player format:
  ```html
  <div class="video-container" style="border-radius: 12px; overflow: hidden; margin: 16px 0;">
    <!-- preload="none" saves bandwidth. Add #t=start,end to constrain playback -->
    <video controls preload="none" style="width: 100%; aspect-ratio: 16/9; background: #000;" src="/api/projects/[SLUG]/files/videos/[VIDEO_FILE]#t=[START_SECONDS],[END_SECONDS]">
      Your browser does not support the video tag.
    </video>
    <div style="padding: 12px; font-style: italic; color: #555;">
      "[Exact quote from findings.md]"
    </div>
  </div>
  ```

### Step 4: Output `findings.html` Directly
- The final output should be raw HTML content containing your beautiful report layout.
- Save the result to `findings.html` in the exact project directory.
- **CRITICAL**: Do NOT output Markdown codeblocks (e.g., ````html...````). Just the raw content directly into `findings.html`. 

## Rules for the HTML Report
- **Auto-Formatting**: Use bullet points for takeaways, tables if comparing different perspectives, and styled blocks for warnings/insights.
- **Engaging readability**: Add a short executive summary at the top if it makes sense.
- **No Markdown**: The file must be valid HTML (`<div>`, `<section>`, `<h1>`, etc.). Avoid markdown tags like `#` or `*` in the output file.
- **Save Bandwidth**: By setting `preload="none"`, the video player will not auto-buffer, only buffering when the user explicitly clicks the Play button.
- **Light backgrounds only—no dark sections**: Do NOT use dark backgrounds anywhere in the report. Dark header strips and dark recommendation panels are rare in research reports and clash with typical reading expectations. Use light backgrounds for the title/header, recommendations, and every section. Create hierarchy with borders, subtle tints (e.g. primary/10), left-accent borders, or light shaded panels—never dark fills.

## File locations
- Input: `content/projects/[slug]/findings.md` (researcher-edited)
- Output: `content/projects/[slug]/findings.html` (published HTML report preview)

When asked to act on the `report-publication` skill, always follow these 4 steps explicitly.
