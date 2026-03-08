// src/lib/adapters.ts
import { LocalFolderAdapter } from "@/adapters/local-folder";
import { PublishAdapter } from "@/adapters/types";

const ADAPTERS: Record<string, PublishAdapter> = {
  "local-folder": LocalFolderAdapter,
};

export function getAdapter(id: string): PublishAdapter | null {
  return ADAPTERS[id] || null;
}

export function listAdapters(): PublishAdapter[] {
  return Object.values(ADAPTERS);
}
