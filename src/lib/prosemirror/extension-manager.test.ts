import { describe, it, expect } from "vitest";
import { pmSchema, pmSerializer, pmParser } from "./index";

function roundTrip(md: string): string {
  return pmSerializer.serialize(pmParser.parse(md));
}

describe("ExtensionManager: stock schema/serializer/parser", () => {
  it("builds the expected node and mark names", () => {
    expect(Object.keys(pmSchema.nodes).sort()).toEqual(
      [
        "doc",
        "text",
        "paragraph",
        "blockquote",
        "horizontal_rule",
        "heading",
        "code_block",
        "ordered_list",
        "bullet_list",
        "list_item",
        "hard_break",
        "image",
        "quote",
        "callout",
        "table",
        "table_row",
        "table_cell",
        "table_header",
      ].sort()
    );
    expect(Object.keys(pmSchema.marks).sort()).toEqual(["strong", "em", "code", "link"].sort());
  });

  it("round-trips headings, paragraphs, and inline marks byte-for-byte", () => {
    const md = "# Heading one\n\nSome *italic* and **bold** and `code` text.";
    expect(roundTrip(md)).toBe(md);
  });

  it("round-trips a link", () => {
    const md = "Check [this link](https://example.com) out.";
    expect(roundTrip(md)).toBe(md);
  });

  it("round-trips a blockquote", () => {
    const md = "> A quoted line.";
    expect(roundTrip(md)).toBe(md);
  });

  it("round-trips a bullet list using the '-' marker", () => {
    const md = "- one\n\n- two\n\n- three";
    expect(roundTrip(md)).toBe(md);
  });

  it("round-trips an ordered list", () => {
    const md = "1. one\n\n2. two";
    expect(roundTrip(md)).toBe(md);
  });

  it("round-trips a horizontal rule", () => {
    const md = "above\n\n---\n\nbelow";
    expect(roundTrip(md)).toBe(md);
  });

  it("uses the SAME schema/serializer/parser instance the editor would use (no drift possible)", () => {
    // This is the structural point of the rewrite: importing from "./index" here is
    // exactly what RichMarkdownEditor.tsx does — there is no second copy of the schema
    // a test could accidentally validate instead of the live one.
    expect(pmParser.schema).toBe(pmSchema);
  });
});
