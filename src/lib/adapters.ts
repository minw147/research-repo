// src/lib/adapters.ts
import { LocalFolderAdapter } from "@/adapters/local-folder";
import { SharePointOneDriveAdapter } from "@/adapters/sharepoint-onedrive";
import { GoogleDriveAdapter } from "@/adapters/google-drive";
import { PublishAdapter } from "@/adapters/types";

const ADAPTERS: Record<string, PublishAdapter> = {
  "local-folder": LocalFolderAdapter,
  "sharepoint-onedrive": SharePointOneDriveAdapter,
  "google-drive": GoogleDriveAdapter,
};

export function getAdapter(id: string): PublishAdapter | null {
  return ADAPTERS[id] ?? null;
}

export function listAdapters(): PublishAdapter[] {
  return Object.values(ADAPTERS);
}
