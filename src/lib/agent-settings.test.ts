import { describe, it, expect, afterEach } from "vitest";
import path from "path";
import fs from "fs";
import os from "os";
import { getAgentSettings, saveAgentSettings } from "./agent-settings";

const testPath = path.join(os.tmpdir(), `agent-settings-test-${Date.now()}.json`);

afterEach(() => {
  try {
    fs.unlinkSync(testPath);
  } catch {
    // file may not exist — that's fine
  }
});

describe("getAgentSettings", () => {
  it("returns default { cli: 'claude' } when file is missing", () => {
    expect(getAgentSettings(testPath)).toEqual({ cli: "claude" });
  });

  it("returns default when file contains invalid JSON", () => {
    fs.writeFileSync(testPath, "not valid json {{{");
    expect(getAgentSettings(testPath)).toEqual({ cli: "claude" });
  });

  it("round-trips: saveAgentSettings then getAgentSettings returns saved value", () => {
    saveAgentSettings({ cli: "custom", customTemplate: "echo {prompt}" }, testPath);
    expect(getAgentSettings(testPath)).toEqual({
      cli: "custom",
      customTemplate: "echo {prompt}",
    });
  });
});

describe("saveAgentSettings", () => {
  it("writes pretty-printed JSON to the given path", () => {
    saveAgentSettings({ cli: "claude" }, testPath);
    const raw = fs.readFileSync(testPath, "utf8");
    expect(JSON.parse(raw)).toEqual({ cli: "claude" });
    // verify pretty-printed (contains newline)
    expect(raw).toContain("\n");
  });
});
