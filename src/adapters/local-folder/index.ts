// src/adapters/local-folder/index.ts
import { PublishAdapter } from "../types";
import fs from "fs";
import path from "path";

export const LocalFolderAdapter: PublishAdapter = {
  id: "local-folder",
  name: "Local Folder",
  description: "Copy the report to another folder on this computer.",
  icon: "Folder",
  configSchema: [
    { key: "targetPath", label: "Target Directory", type: "path", required: true, placeholder: "/Users/name/Reports" }
  ],
  async publish(payload, config) {
    const { projectDir } = payload;
    const { targetPath } = config;

    if (!targetPath) {
      return { success: false, message: "Target directory is required" };
    }

    try {
      if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath, { recursive: true });
      }

      const exportDir = path.join(projectDir, "export");
      
      if (!fs.existsSync(exportDir)) {
        return { success: false, message: `Export directory not found: ${exportDir}. Run export first.` };
      }

      // Using cpSync for recursive copy
      fs.cpSync(exportDir, targetPath, { recursive: true, force: true });

      return { success: true, message: `Published to ${targetPath}` };
    } catch (error: any) {
      console.error("Publishing to local folder failed:", error);
      return { success: false, message: `Publish failed: ${error.message}` };
    }
  }
};
