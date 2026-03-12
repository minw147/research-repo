# Research Hub — Setup Guide

Two ways to give stakeholders a browsable research hub, depending on where you publish:

| Destination | Viewer | Requires |
|---|---|---|
| **Local Folder / SharePoint** | Static `index.html` in the folder — just double-click | Nothing (works offline) |
| **Google Drive** | Vercel-hosted `/hub` page | Service account + env vars (see below) |

---

## Option A — Local Folder or SharePoint viewer

Every time you publish a report to a Local Folder or SharePoint destination, the app automatically writes two files to the root of that folder:

```
Reports/                   ← your target folder
├── index.html             ← self-contained viewer (open this)
├── repo-index.json        ← auto-updated manifest of all reports
├── ai-chip-war-podcast/
│   ├── index.html         ← the report
│   └── clips/
│       └── *.mp4
└── another-project/
    └── index.html
```

**To view:** open the folder in Explorer / Finder and double-click `index.html`. It loads in the browser, reads `repo-index.json`, and shows a searchable card grid of all published reports. Clicking "View Report" opens the report in a new tab.

**For SharePoint:** the folder is already synced to SharePoint via OneDrive. Anyone with access to the SharePoint library can navigate to it and open `index.html` directly, or share the link to the file in the SharePoint document library.

**Updates automatically:** each new publish refreshes both `repo-index.json` and `index.html`, so stakeholders always see the latest list when they refresh the page.

---

## Option B — Google Drive + Vercel hosted hub

The Research Hub (`/hub`) is a read-only viewer that lets stakeholders browse published reports and watch video clips. It reads from the same Google Drive folder you publish reports to, using a **service account** (no personal sign-in required for viewers).

---

## Architecture

```
Researcher machine          Google Drive folder
  (this repo)          →    ├── repo-index.json        ← manifest of all reports
  npm run dev               └── ai-chip-war-podcast/
  Publish Report                ├── index.html         ← the report
                                └── clips/
                                    └── *.mp4

Vercel (or localhost)
  /hub                 ←    reads repo-index.json via service account
  /api/drive/index          proxies Drive API server-side
  /api/drive/video/[id]     streams video to browser
  /api/drive/report/[id]    serves HTML report in iframe
```

---

## One-Time Setup

### Step 1 — Create a Google Cloud service account

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → select your project
2. **IAM & Admin → Service Accounts → + Create Service Account**
   - Name: `research-hub-viewer` (or anything descriptive)
   - Click **Create and Continue**, skip the optional steps, click **Done**
3. Click the service account you just created
4. Go to **Keys → Add Key → Create new key → JSON**
5. Download the `.json` key file — you'll need its contents in Step 3

### Step 2 — Share your Drive publish folder with the service account

1. Open the Google Drive folder you publish reports to (the one whose ID is in the Publish modal)
2. Click **Share**
3. Paste the service account email — it looks like:
   `research-hub-viewer@your-project-id.iam.gserviceaccount.com`
   (visible in the downloaded JSON as `client_email`)
4. Set role to **Viewer** → click **Share**

### Step 3 — Add environment variables

**For local development** — create `.env.local` in the repo root (already gitignored):

```
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"research-hub-viewer@your-project.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token"}
DRIVE_ROOT_FOLDER_ID=170BkQ0Wg54F4x6a18N1h5R8P-M3Exxx
```

- `GOOGLE_SERVICE_ACCOUNT_JSON` — paste the **entire contents** of the downloaded JSON key file, all on one line
- `DRIVE_ROOT_FOLDER_ID` — the folder ID from your Drive URL:
  `https://drive.google.com/drive/folders/`**`THIS_PART`**

**For Vercel** — add the same two variables in:
**Vercel Dashboard → Your Project → Settings → Environment Variables**

### Step 4 — Test locally

```bash
npm run dev
```

Open: **http://localhost:3000/hub**

You should see project cards for every report published to the Drive folder. If `repo-index.json` doesn't exist yet (no reports published), it shows an empty state — publish a report first from the Report Builder.

---

## Deploying to Vercel

1. Push your repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → import the repo
3. Add the two env vars from Step 3 in the Vercel dashboard
4. Deploy

Hub will be live at: `https://your-project.vercel.app/hub`

Share this URL with stakeholders — no Google sign-in required on their end.

---

## How publishing connects to the hub

Every time you click **Publish Report → Google Drive** in the Report Builder:

1. The report HTML and video clips are uploaded to a project subfolder in Drive
2. `repo-index.json` in the root folder is updated with the project metadata and Drive file IDs
3. The hub reads `repo-index.json` on page load and renders a card per project
4. "View Report" opens the HTML via `/api/drive/report/[fileId]` (proxied, private)
5. Video clips stream via `/api/drive/video/[fileId]` (Edge runtime, supports seeking)

The Drive folder stays **private** — the service account proxies all content server-side, so viewers never need Google access.

---

## Troubleshooting

| Symptom | Likely cause |
|---------|-------------|
| `/hub` shows "Failed to load projects" | `GOOGLE_SERVICE_ACCOUNT_JSON` not set or malformed JSON |
| `/hub` loads but shows empty | No reports published yet, or Drive folder ID is wrong |
| "Drive error: 403" in browser console | Service account not shared on the Drive folder (Step 2) |
| Videos don't play / 401 error | Service account token expired — refresh the page (token is fetched fresh per request) |
| "DRIVE_ROOT_FOLDER_ID is misconfigured" | Folder ID contains invalid characters — copy it directly from the Drive URL |
