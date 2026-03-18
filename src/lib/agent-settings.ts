import path from "path";
import fs from "fs";

export interface AgentSettings {
  cli: "claude" | "custom";
  customTemplate?: string;
}

export const SETTINGS_PATH = path.join(process.cwd(), "agent-settings.json");

export function getAgentSettings(settingsPath = SETTINGS_PATH): AgentSettings {
  try {
    return JSON.parse(fs.readFileSync(settingsPath, "utf8"));
  } catch {
    return { cli: "claude" };
  }
}

export function saveAgentSettings(
  settings: AgentSettings,
  settingsPath = SETTINGS_PATH
): void {
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), "utf8");
}
