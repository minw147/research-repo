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
  description: string;
  icon: string;
  configSchema: AdapterConfigField[];
  publish(payload: PublishPayload, config: Record<string, any>): Promise<PublishResult>;
}
