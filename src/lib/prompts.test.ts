// src/lib/prompts.test.ts
import { describe, test, expect } from "vitest";
import { generateThematicAnalysisPrompt, generateTaggingPrompt } from "./prompts";
import type { Project } from "@/types";

describe("AI Analysis Prompts", () => {
  const mockProject: Project = {
    id: "p1",
    title: "Test Project",
    date: "2026-03-07",
    researcher: "Jane Doe",
    persona: "A busy professional",
    product: "Task App",
    status: "setup",
    codebook: null,
    sessions: [
      { id: "s1", participant: "P1", videoFile: "v1.mp4", transcriptFile: "t1.json" }
    ],
    publishedUrl: null
  };

  const mockTranscript = "00:01|Hello there\n00:05|This is a test";

  test("generateThematicAnalysisPrompt returns formatted prompt", () => {
    const prompt = generateThematicAnalysisPrompt(mockProject, mockTranscript, 2);
    expect(prompt).toContain('Analyze this UX research transcript for the project "Test Project".');
    expect(prompt).toContain('Context: A busy professional testing Task App.');
    expect(prompt).toContain('session: 2');
    expect(prompt).toContain(mockTranscript);
  });

  test("generateTaggingPrompt returns formatted prompt", () => {
    const codebook = "tag1: Feature A\ntag2: Bug";
    const prompt = generateTaggingPrompt(mockTranscript, codebook, 3);
    expect(prompt).toContain("Using this codebook:");
    expect(prompt).toContain(codebook);
    expect(prompt).toContain(mockTranscript);
    expect(prompt).toContain("session: 3 | tags: tag1, tag2");
  });
});
