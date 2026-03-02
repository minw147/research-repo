# Video clips (gitignored)

Place pre-generated clip files here for local development. These files are **not committed** to the repo—videos are hosted on OneDrive/SharePoint/Google Drive in production.

## Slicing clips from reports

Run the slice script to extract clips from full videos based on `<Clip>` components in MDX reports:

```bash
npm run slice-clips                    # all reports
npm run slice-clips -- --report ai-chip-war-gpu-tpu   # single report
```

Output: `public/videos/clips/` (e.g. `ai-chip-war-gpu-tpu_01_70s.mp4`). Uses FFmpeg with stream copy (no re-encode, fast).

## Manual slicing

For one-off clips:
```bash
ffmpeg -i full.mp4 -ss 00:04:30 -t 15 -c copy clip1.mp4
```
Put output in this folder and reference as `/videos/clip1.mp4` in your MDX reports.
