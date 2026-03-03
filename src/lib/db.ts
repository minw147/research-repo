import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import matter from "gray-matter";
import type { Study, StudyWithContent, Report } from "@/types";
import { parseTranscript, type TranscriptLine } from "./transcript";

const DATA_DIR = join(process.cwd(), "data");
const CONTENT_DIR = join(process.cwd(), "content", "reports");
const TRANSCRIPT_DIR = join(DATA_DIR, "transcripts");

export type { TranscriptLine };

export function getTranscriptForStudy(transcriptFile: string): TranscriptLine[] | null {
  const filePath = join(TRANSCRIPT_DIR, transcriptFile);
  if (!existsSync(filePath)) return null;
  return parseTranscript(readFileSync(filePath, "utf-8"));
}

export function getAllStudies(): Study[] {
  const filePath = join(DATA_DIR, "research-index.json");
  if (!existsSync(filePath)) return [];
  const raw = readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as Study[];
}

/** Strip JSX tags and markdown to plain text for search indexing */
function stripMdxToPlainText(content: string): string {
  let text = content
    .replace(/<[^>]+>/g, " ") // Remove JSX/HTML tags
    .replace(/[#*_`[\]()]/g, " ") // Remove markdown formatting
    .replace(/\s+/g, " ") // Collapse whitespace
    .trim();
  return text;
}

export function getAllStudiesWithContent(): StudyWithContent[] {
  const studies = getAllStudies();
  return studies.map((study) => {
    const report = getReportContent(study.reportFile);
    const rawContent = report?.content ?? "";
    const searchText = stripMdxToPlainText(rawContent);
    return { ...study, searchText };
  });
}

export function getStudyById(id: string): Study | null {
  const studies = getAllStudies();
  return studies.find((s) => s.id === id) ?? null;
}

export function getReportContent(filename: string): Report | null {
  const filePath = join(CONTENT_DIR, filename);
  if (!existsSync(filePath)) return null;
  const raw = readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  return {
    frontmatter: data as Report["frontmatter"],
    content,
  };
}

export function getReportRaw(filename: string): string | null {
  const filePath = join(CONTENT_DIR, filename);
  if (!existsSync(filePath)) return null;
  return readFileSync(filePath, "utf-8");
}

export function getAllReportFilenames(): string[] {
  if (!existsSync(CONTENT_DIR)) return [];
  return readdirSync(CONTENT_DIR).filter(
    (f: string) => f.endsWith(".mdx") || f.endsWith(".md")
  );
}
