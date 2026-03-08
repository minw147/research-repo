// src/types/index.ts

export interface Session {
  id: string;
  participant: string;
  videoFile: string;
  transcriptFile: string;
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
  sessions: Session[];
  publishedUrl: string | null;
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
}

export interface TranscriptLine {
  sec: number;
  text: string;
}

export interface AppConfig {
  aiMode: "auto" | "claude-cli" | "copy-paste";
  adapters: Record<string, Record<string, unknown>>;
}

export interface PublishPayload {
  projectDir: string;
  project: Project;
  htmlPath: string;
  clipsDir: string;
  tagsHtmlPath?: string;
}

export interface PublishResult {
  success: boolean;
  url?: string;
  message: string;
}

export interface AdapterConfigField {
  key: string;
  label: string;
  type: "text" | "password" | "path" | "select";
  required: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
}

export interface PublishAdapter {
  id: string;
  name: string;
  icon: string;
  configSchema: AdapterConfigField[];
  publish(payload: PublishPayload): Promise<PublishResult>;
}
