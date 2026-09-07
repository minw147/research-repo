import { describe, it, expect } from "vitest";
import { pmParser, pmSerializer, pmSchema } from "./index";

// Regression: parsing an empty document used to blow the stack because bullet_list was
// registered before paragraph, making ProseMirror's auto-fill pick bullet_list ->
// list_item -> block+ -> bullet_list ... forever. See the comment in nodes/stock.ts.
describe("empty document parsing", () => {
  it("parses an empty string into a single empty paragraph", () => {
    const doc = pmParser.parse("");
    expect(doc.childCount).toBe(1);
    expect(doc.child(0).type).toBe(pmSchema.nodes.paragraph);
    expect(pmSerializer.serialize(doc)).toBe("");
  });

  it("parses a whitespace-only string without crashing", () => {
    expect(() => pmParser.parse("   \n\n  ")).not.toThrow();
  });

  it("auto-fills the top-level doc with a paragraph, not a list", () => {
    const doc = pmSchema.topNodeType.createAndFill()!;
    expect(doc.child(0).type).toBe(pmSchema.nodes.paragraph);
  });
});
