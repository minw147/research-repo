// src/lib/prompts.test.ts
import { describe, test, expect } from "vitest";
import {
  buildAnalyzeTranscriptsPrompt,
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

  test("buildAnalyzeTranscriptsPrompt returns formatted prompt", () => {
    const prompt = buildAnalyzeTranscriptsPrompt(mockProject, mockCodebook);
    expect(prompt).toContain('Analyze all transcript files in the \'transcripts/\' directory for the project "Test Project".');
    expect(prompt).toContain('Context: A busy professional testing Task App.');
    expect(prompt).toContain('Research Plan: Test out some new features.');
    expect(prompt).toContain('Tag A');
    expect(prompt).toContain('Tag B');
  });

  test("buildAddThemePrompt returns formatted prompt", () => {
    const prompt = buildAddThemePrompt(mockProject, "Theme X");
    expect(prompt).toContain('Analyze research data (findings.md and transcripts/) to find evidence for a new theme: "Theme X".');
    expect(prompt).toContain('Project: Test Project');
    expect(prompt).toContain('Persona: A busy professional');
  });

  test("buildGenerateTagsPrompt returns formatted prompt", () => {
    const prompt = buildGenerateTagsPrompt(mockProject, mockCodebook, "findings");
    expect(prompt).toContain("Review the research data in 'findings.md' for the project \"Test Project\".");
    expect(prompt).toContain("Tag A");
    expect(prompt).toContain("Tag B");
  });

  test("buildGenerateReportPrompt returns formatted prompt", () => {
    const prompt = buildGenerateReportPrompt(mockProject, "blog");
    expect(prompt).toContain("Review 'findings.md' and 'tags.md' in the current directory for the project \"Test Project\".");
    expect(prompt).toContain("Style: Long-form Blog Post / Case Study.");
  });

  test("generateThematicAnalysisPrompt returns formatted prompt (deprecated)", () => {
    const prompt = generateThematicAnalysisPrompt(mockProject, mockTranscript, 2);
    expect(prompt).toContain('Analyze this UX research transcript for the project "Test Project".');
    expect(prompt).toContain('Context: A busy professional testing Task App.');
    expect(prompt).toContain('session: 2');
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
});
