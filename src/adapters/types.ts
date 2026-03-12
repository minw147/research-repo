// src/adapters/types.ts
import { Project } from "@/types";

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

export interface HelpStep {
  text: string;
  /** Optional URL — renders the step text as a link */
  url?: string;
}

export interface FieldHelp {
  title: string;
  steps: HelpStep[];
}

export interface AdapterConfigField {
  key: string;
  label: string;
  type: "text" | "password" | "path" | "select" | "oauth";
  required: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
  /** For oauth fields: the provider name used in /api/auth/[provider] routes */
  provider?: string;
  /** Optional step-by-step guide shown when the user clicks the help icon */
  help?: FieldHelp;
}

export interface PublishAdapter {
  id: string;
  name: string;
  description: string;
  icon: string;
  configSchema: AdapterConfigField[];
  publish(payload: PublishPayload, config: Record<string, any>): Promise<PublishResult>;
}
