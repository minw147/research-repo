import { describe, it, expect } from "vitest";
import { slugifyLabel, generateTagId } from "./codebook-utils";

describe("slugifyLabel", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    expect(slugifyLabel("UI Friction")).toBe("ui-friction");
  });

  it("strips special characters", () => {
    expect(slugifyLabel("Pain Point!")).toBe("pain-point");
  });

  it("collapses multiple hyphens", () => {
    expect(slugifyLabel("A  B")).toBe("a-b");
  });
});

describe("generateTagId", () => {
  it("returns slug when no collision", () => {
    expect(generateTagId("UI Friction", [])).toBe("ui-friction");
  });

  it("appends -2 on first collision", () => {
    expect(generateTagId("UI Friction", ["ui-friction"])).toBe("ui-friction-2");
  });

  it("appends -3 on second collision", () => {
    expect(
      generateTagId("UI Friction", ["ui-friction", "ui-friction-2"])
    ).toBe("ui-friction-3");
  });
});
