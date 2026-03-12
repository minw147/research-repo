import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import {
  getProject,
  addSessionToProject,
  sanitizeSlug,
  sessionFilename,
} from "@/lib/projects";
import type { Session } from "@/types";

const PROJECTS_DIR = path.join(process.cwd(), "content/projects");

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const slug = sanitizeSlug(params.slug);
  if (!slug) {
    return NextResponse.json({ error: "Invalid project slug" }, { status: 400 });
  }

  const project = getProject(slug);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid form data" },
      { status: 400 }
    );
  }

  const participant =
    (formData.get("participant") as string | null)?.trim() || "Participant";
  const video = formData.get("video") as File | null;
  const transcript = formData.get("transcript") as File | null;

  if (!video || !transcript || video.size === 0 || transcript.size === 0) {
    return NextResponse.json(
      { error: "Both video and transcript files are required" },
      { status: 400 }
    );
  }

  const sessionIndex = project.sessions.length + 1;
  const videoExt = path.extname(video.name).slice(1) || "mp4";
  const transcriptExt = path.extname(transcript.name).slice(1) || "txt";
  const videoFileName = sessionFilename(sessionIndex, videoExt);
  const transcriptFileName = sessionFilename(sessionIndex, transcriptExt);

  const projectDir = path.join(PROJECTS_DIR, slug);
  const videosDir = path.join(projectDir, "videos");
  const transcriptsDir = path.join(projectDir, "transcripts");

  fs.mkdirSync(videosDir, { recursive: true });
  fs.mkdirSync(transcriptsDir, { recursive: true });

  const videoPath = path.join(videosDir, videoFileName);
  const transcriptPath = path.join(transcriptsDir, transcriptFileName);

  try {
    const videoBuf = Buffer.from(await video.arrayBuffer());
    const transcriptBuf = Buffer.from(await transcript.arrayBuffer());
    fs.writeFileSync(videoPath, videoBuf);
    fs.writeFileSync(transcriptPath, transcriptBuf);
  } catch (err) {
    console.error("Failed to write session files:", err);
    return NextResponse.json(
      { error: "Failed to save files" },
      { status: 500 }
    );
  }

  const session: Session = {
    id: `session-${sessionIndex}`,
    participant,
    videoFile: videoFileName,
    transcriptFile: transcriptFileName,
  };

  const updated = addSessionToProject(slug, session);
  if (!updated) {
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }

  return NextResponse.json(updated);
}
