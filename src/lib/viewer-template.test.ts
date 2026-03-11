// src/lib/viewer-template.test.ts
import { describe, it, expect } from "vitest";
import { generateViewerHtml } from "./viewer-template";

describe("generateViewerHtml", () => {
  it("renders tab nav with Projects and Tag Board buttons", () => {
    const html = generateViewerHtml();
    expect(html).toContain('id="tab-projects"');
    expect(html).toContain('id="tab-tagboard"');
  });

  it("renders tag board panel and controls", () => {
    const html = generateViewerHtml();
    expect(html).toContain('id="quote-grid"');
    expect(html).toContain('id="tb-search"');
    expect(html).toContain('id="tb-tag"');
    expect(html).toContain('id="tb-project"');
    expect(html).toContain('id="tb-persona"');
    expect(html).toContain('id="tb-product"');
    expect(html).toContain('id="tb-clear"');
  });

  it("renders projects panel with existing controls", () => {
    const html = generateViewerHtml();
    expect(html).toContain('id="project-grid"');
    expect(html).toContain('id="search"');
    expect(html).toContain('id="f-researcher"');
    expect(html).toContain('id="btn-clear"');
  });

  it("inlines quote data when data option is provided", () => {
    const data = [{
      id: "p1",
      quotes: [{ text: "hello", tags: ["delight"], clipFile: "clip-1-10s.mp4", sessionIndex: 1, startSeconds: 10 }],
      codebook: [{ id: "delight", label: "Delight", color: "#10B981", category: "Positive" }]
    }];
    const html = generateViewerHtml({ data });
    expect(html).toContain("clip-1-10s.mp4");
    expect(html).toContain("INLINE_DATA");
  });

  it("sets INLINE_DATA to null when no data provided", () => {
    const html = generateViewerHtml();
    expect(html).toContain("const INLINE_DATA = null;");
  });

  it("includes switchTab, buildTagIndex, renderTagBoard functions", () => {
    const html = generateViewerHtml();
    expect(html).toContain("function switchTab(");
    expect(html).toContain("function renderTagBoard(");
    expect(html).toContain("function buildTagIndex(");
    expect(html).toContain("function populateTagBoard(");
  });

  it("escapes title correctly", () => {
    const html = generateViewerHtml({ title: 'Research <Hub> & "Viewer"' });
    expect(html).toContain("Research &lt;Hub&gt; &amp; &quot;Viewer&quot;");
    expect(html).not.toContain('<Hub>');
  });
});
