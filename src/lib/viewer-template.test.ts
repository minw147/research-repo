import { describe, it, expect } from "vitest";
import { generateViewerHtml } from "./viewer-template";

describe("generateViewerHtml", () => {
  it("returns a complete HTML document", () => {
    const html = generateViewerHtml();
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<html");
    expect(html).toContain("</html>");
  });

  it("inlines CSS (no external stylesheet link)", () => {
    const html = generateViewerHtml();
    expect(html).not.toContain('<link rel="stylesheet"');
    expect(html).toContain("<style>");
  });

  it("inlines JavaScript (no external script src)", () => {
    const html = generateViewerHtml();
    expect(html).not.toContain('<script src=');
    expect(html).toContain("fetch('repo-index.json')");
  });

  it("includes a search input", () => {
    const html = generateViewerHtml();
    expect(html).toContain('id="search"');
  });

  it("includes the project-grid element", () => {
    const html = generateViewerHtml();
    expect(html).toContain('id="project-grid"');
  });

  it("includes filter selects for researcher, persona, product, sort", () => {
    const html = generateViewerHtml();
    expect(html).toContain('id="f-researcher"');
    expect(html).toContain('id="f-persona"');
    expect(html).toContain('id="f-product"');
    expect(html).toContain('id="f-sort"');
  });

  it("includes a clear filters button", () => {
    const html = generateViewerHtml();
    expect(html).toContain('id="btn-clear"');
  });

  it("includes a report count display", () => {
    const html = generateViewerHtml();
    expect(html).toContain('id="count"');
  });

  it("accepts an optional title override", () => {
    const html = generateViewerHtml({ title: "ACME Research Hub" });
    expect(html).toContain("ACME Research Hub");
  });
});
