// src/lib/adapter-config.ts
// Persists adapter configs (including secrets) outside the repo in
// ~/.research-repo/adapter-config.json so they can never be git-committed.
// Protected by OS user-level file permissions.

import fs from "fs";
import path from "path";
import os from "os";

const CONFIG_DIR = path.join(os.homedir(), ".research-repo");
const CONFIG_FILE = path.join(CONFIG_DIR, "adapter-config.json");

type AdapterConfigs = Record<string, Record<string, unknown>>;

function readAll(): AdapterConfigs {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function writeAll(configs: AdapterConfigs): void {
  if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(configs, null, 2), { mode: 0o600 });
}

export function getAdapterConfig(adapterId: string): Record<string, unknown> {
  return readAll()[adapterId] ?? {};
}

export function saveAdapterConfig(adapterId: string, config: Record<string, unknown>): void {
  const all = readAll();
  all[adapterId] = config;
  writeAll(all);
}
