import { describe, it, expect } from "vitest";
import { buildColorThemePrompt, COLOR_THEMES, TAG_COLORS, assignTagColor } from "./color-themes";
import type { Project } from "@/types";

const mockProject: Project = {
  id: "test-project",
  title: "Test Project",
  date: "2026-03-08",
  researcher: "Jane Doe",
  persona: "Investor",
  product: "Mobile App",
  status: "report",
  researchPlan: "",
  codebook: null,
  sessions: [],
  publishedUrl: null,
};

describe("color-themes", () => {
  it("exports 6 themes", () => {
    expect(COLOR_THEMES).toHaveLength(6);
  });

  it("buildColorThemePrompt includes project path and palette", () => {
    const theme = COLOR_THEMES[0];
    const prompt = buildColorThemePrompt(mockProject, theme);
    expect(prompt).toContain("content/projects/test-project");
    expect(prompt).toContain("findings.html");
    expect(prompt).toContain(theme.name);
    expect(prompt).toContain(theme.colors.primary);
    expect(prompt).toContain("report-publication");
  });
});

describe("TAG_COLORS", () => {
  it("exports exactly 12 hex colors", () => {
    expect(TAG_COLORS).toHaveLength(12);
    TAG_COLORS.forEach((c) => expect(c).toMatch(/^#[0-9a-f]{6}$/i));
  });
});

describe("assignTagColor", () => {
  it("returns first color when none are in use", () => {
    expect(assignTagColor([])).toBe(TAG_COLORS[0]);
  });

  it("skips colors already in use", () => {
    const inUse = [TAG_COLORS[0], TAG_COLORS[1]];
    expect(assignTagColor(inUse)).toBe(TAG_COLORS[2]);
  });

  it("wraps around if all colors used", () => {
    expect(assignTagColor(TAG_COLORS)).toBe(TAG_COLORS[0]);
  });
});
