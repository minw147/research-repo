// src/lib/codebook.test.ts
import { describe, it, expect } from "vitest";
import { mergeCodebooks, getTagById } from "./codebook";
import type { Codebook } from "@/types";

describe("mergeCodebooks", () => {
  const global: Codebook = {
    tags: [
      { id: "usability", label: "Usability Issue", color: "#EF4444", category: "Pain Point" },
    ],
    categories: ["Pain Point"],
  };

  it("returns global when no custom", () => {
    expect(mergeCodebooks(global, null)).toEqual(global);
  });

  it("merges custom tags, custom wins on conflict", () => {
    const custom: Codebook = {
      tags: [
        { id: "usability", label: "UX Problem", color: "#FF0000", category: "Pain Point" },
        { id: "custom-tag", label: "Custom", color: "#000", category: "Custom" },
      ],
      categories: ["Custom"],
    };
    const merged = mergeCodebooks(global, custom);
    expect(merged.tags).toHaveLength(2);
    expect(merged.tags.find((t) => t.id === "usability")?.label).toBe("UX Problem");
    expect(merged.categories).toContain("Custom");
    expect(merged.categories).toContain("Pain Point");
  });
});

describe("getTagById", () => {
  it("finds tag by id", () => {
    const codebook: Codebook = {
      tags: [{ id: "usability", label: "Usability", color: "#F00", category: "X" }],
      categories: ["X"],
    };
    expect(getTagById(codebook, "usability")?.label).toBe("Usability");
    expect(getTagById(codebook, "missing")).toBeNull();
  });
});
