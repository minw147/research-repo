// src/lib/prompts.test.ts
import { describe, test, expect } from "vitest";
import {
  buildAnalyzeTranscriptsPrompt,
  buildAnalyzeFindingsPrompt,
  buildAddThemePrompt,
  buildGenerateTagsPrompt,
  buildGenerateReportPrompt,
  generateThematicAnalysisPrompt,
  generateTaggingPrompt,
} from "./prompts";
import type { Project, Codebook } from "@/types";

describe("AI Analysis Prompts", () => {
  const mockProject: Project = {
    id: "p1",
    title: "Test Project",
    date: "2026-03-07",
    researcher: "Jane Doe",
    persona: "A busy professional",
    product: "Task App",
    status: "setup",
    researchPlan: "Test out some new features.",
    codebook: null,
    sessions: [
      { id: "s1", participant: "P1", videoFile: "v1.mp4", transcriptFile: "t1.json" }
    ],
    publishedUrl: null
  };

  const mockCodebook: Codebook = {
    tags: [
      { id: "t1", label: "Tag A", color: "#F00", category: "Cat1" },
      { id: "t2", label: "Tag B", color: "#00F", category: "Cat2" },
    ],
    categories: ["Cat1", "Cat2"],
  };

  const mockTranscript = "00:01|Hello there\n00:05|This is a test";

  test("buildAnalyzeTranscriptsPrompt returns formatted prompt with project context", () => {
    const prompt = buildAnalyzeTranscriptsPrompt(mockProject, mockCodebook);
    expect(prompt).toContain("content/projects/p1");
    expect(prompt).toContain("Test Project");
    expect(prompt).toContain("Jane Doe");
    expect(prompt).toContain("A busy professional");
    expect(prompt).toContain("Task App");
    expect(prompt).toContain("Test out some new features.");
    expect(prompt).toContain("transcripts/");
    expect(prompt).toContain("Tag A");
    expect(prompt).toContain("Tag B");
  });

  test("buildAddThemePrompt returns formatted prompt", () => {
    const prompt = buildAddThemePrompt(mockProject, "Theme X");
    expect(prompt).toContain('Theme X');
    expect(prompt).toContain("Test Project");
    expect(prompt).toContain("A busy professional");
    expect(prompt).toContain("findings.md");
  });

  test("buildGenerateTagsPrompt returns formatted prompt for findings source", () => {
    const prompt = buildGenerateTagsPrompt(mockProject, mockCodebook, "findings");
    expect(prompt).toContain("findings.md");
    expect(prompt).toContain("tags.md");
    expect(prompt).toContain("Test Project");
    expect(prompt).toContain("Tag A");
    expect(prompt).toContain("Tag B");
  });

  test("buildGenerateTagsPrompt returns formatted prompt for transcripts source", () => {
    const prompt = buildGenerateTagsPrompt(mockProject, mockCodebook, "transcripts");
    expect(prompt).toContain("scanning all session transcripts");
    expect(prompt).toContain("tags.md");
    expect(prompt).toContain("Test Project");
    expect(prompt).toContain("Tag A");
    expect(prompt).toContain("Tag B");
  });

  test("prompts do not reference non-interactive or CLI-specific instructions", () => {
    const prompts = [
      buildAnalyzeTranscriptsPrompt(mockProject, mockCodebook),
      buildGenerateTagsPrompt(mockProject, mockCodebook, "findings"),
      buildGenerateTagsPrompt(mockProject, mockCodebook, "transcripts"),
    ];
    for (const p of prompts) {
      expect(p).not.toContain("non-interactive");
      expect(p).not.toContain("run the CLI");
      expect(p).not.toContain("Do not ask");
    }
  });

  test("buildGenerateReportPrompt returns formatted prompt", () => {
    const prompt = buildGenerateReportPrompt(mockProject, "blog");
    expect(prompt).toContain("findings.md");
    expect(prompt).toContain("tags.md");
    expect(prompt).toContain("Test Project");
    expect(prompt).toContain("Long-form Blog Post / Case Study");
  });

  test("generateThematicAnalysisPrompt returns formatted prompt (deprecated)", () => {
    const prompt = generateThematicAnalysisPrompt(mockProject, mockTranscript, 2);
    expect(prompt).toContain("Test Project");
    expect(prompt).toContain("session 2");
    expect(prompt).toContain(mockTranscript);
  });

  test("generateTaggingPrompt returns formatted prompt (deprecated)", () => {
    const codebook = "tag1: Feature A\ntag2: Bug";
    const prompt = generateTaggingPrompt(mockTranscript, codebook, 3);
    expect(prompt).toContain("Using this codebook:");
    expect(prompt).toContain(codebook);
    expect(prompt).toContain(mockTranscript);
    expect(prompt).toContain("session: 3 | tags: tag1, tag2");
  });

  test("buildAnalyzeTranscriptsPrompt references Step 4a not Steps 1-5", () => {
    const prompt = buildAnalyzeTranscriptsPrompt(mockProject, mockCodebook);
    expect(prompt).toContain("Step 4a");
    expect(prompt).not.toContain("Steps 1–5");
    expect(prompt).not.toContain("Steps 1-5");
  });

  test("buildAnalyzeFindingsPrompt references Step 4a not Steps 1-5", () => {
    const prompt = buildAnalyzeFindingsPrompt(mockProject, mockCodebook);
    expect(prompt).toContain("Step 4a");
    expect(prompt).not.toContain("Steps 1–5");
    expect(prompt).not.toContain("Steps 1-5");
  });

  test("buildGenerateTagsPrompt references Step 4b not Steps 1-5", () => {
    const prompt = buildGenerateTagsPrompt(mockProject, mockCodebook, "findings");
    expect(prompt).toContain("Step 4b");
    expect(prompt).not.toContain("Steps 1–5");
    expect(prompt).not.toContain("Steps 1-5");
  });
});
