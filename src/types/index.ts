// src/types/index.ts

export interface Session {
  id: string;
  participant: string;
  videoFile: string;
  transcriptFile: string;
}

export interface PublishRecord {
  adapterId: string;
  adapterName: string;
  url: string;
  publishedAt: string; // ISO date string
}

export interface Project {
  id: string;
  title: string;
  date: string;
  researcher: string;
  persona: string;
  product?: string;
  status: ProjectStatus;
  researchPlan?: string;
  codebook: string | null;
  codebookData?: Codebook; // Merged codebook object
  sessions: Session[];
  publishedUrl: string | null; // kept for backward compat — last published URL
  publishedUrls?: PublishRecord[]; // full history, one record per destination
}

export type ProjectStatus =
  | "setup"
  | "findings"
  | "tagged"
  | "report"
  | "exported"
  | "published";

export interface CodebookTag {
  id: string;
  label: string;
  color: string;
  category: string;
}

export interface Codebook {
  tags: CodebookTag[];
  categories: string[];
}

export interface ParsedQuote {
  text: string;
  timestampDisplay: string;
  startSeconds: number;
  durationSeconds: number;
  sessionIndex: number;
  tags: string[];
  rawLine: string;
  hidden?: boolean;
}

export interface TranscriptLine {
  sec: number;
  text: string;
}

export interface AppConfig {
  aiMode: "auto" | "claude-cli" | "copy-paste";
  adapters: Record<string, Record<string, unknown>>;
}
