import { describe, it, expect } from "vitest";
import { ExtensionManager } from "../extension-manager";
import { createStockNodeExtensions, createStockMarkExtensions } from "./stock";
import { QuoteExtension } from "./quote";
import { formatQuoteAsMarkdown } from "@/lib/quote-parser";

function makeManager() {
  return new ExtensionManager([...createStockNodeExtensions(), ...createStockMarkExtensions(), new QuoteExtension()]);
}

describe("QuoteExtension", () => {
  it("is a draggable atom block node", () => {
    const { schema } = makeManager();
    const quote = schema.nodes.quote;
    expect(quote.spec.group).toBe("block");
    expect(quote.spec.atom).toBe(true);
    expect(quote.spec.draggable).toBe(true);
  });

  it("serializes to the canonical quote-citation line via formatQuoteAsMarkdown", () => {
    const { schema, serializer } = makeManager();
    const node = schema.nodes.quote.create({
      text: "At a really fundamental level we think about this",
      startSeconds: 128,
      durationSeconds: 16,
      sessionIndex: 1,
      tags: ["mental-model"],
      hidden: false,
    });
    const doc = schema.nodes.doc.create(null, [node]);
    const md = serializer.serialize(doc);
    expect(md).toBe(
      formatQuoteAsMarkdown(
        "At a really fundamental level we think about this",
        128,
        16,
        1,
        ["mental-model"],
        false
      )
    );
    expect(md).toContain('- **"At a really fundamental level');
    expect(md).toContain("@ 02:08 (128s)");
    expect(md).toContain("duration: 16s");
    expect(md).toContain("session: 1");
    expect(md).toContain("tags: mental-model");
  });

  it("serializes hidden quotes with the hidden flag", () => {
    const { schema, serializer } = makeManager();
    const node = schema.nodes.quote.create({
      text: "Hidden quote",
      startSeconds: 30,
      durationSeconds: 20,
      sessionIndex: 2,
      tags: [],
      hidden: true,
    });
    const doc = schema.nodes.doc.create(null, [node]);
    expect(serializer.serialize(doc)).toContain("| hidden: true");
  });

  it("parses a formatted quote line back into a quote node with matching attrs", () => {
    const { parser, schema } = makeManager();
    const line = formatQuoteAsMarkdown("Round trip me", 90, 5, 1, ["a", "b"], false);
    const doc = parser.parse(line);
    expect(doc.childCount).toBe(1);
    const node = doc.child(0);
    expect(node.type).toBe(schema.nodes.quote);
    expect(node.attrs).toMatchObject({
      text: "Round trip me",
      startSeconds: 90,
      durationSeconds: 5,
      sessionIndex: 1,
      tags: ["a", "b"],
      hidden: false,
    });
  });

  it("round-trips a full quote line through parse + serialize byte-for-byte", () => {
    const { parser, serializer } = makeManager();
    const line = formatQuoteAsMarkdown("Exact round trip", 24, 11, 1, ["mental-model"], false);
    expect(serializer.serialize(parser.parse(line))).toBe(line);
  });

  it("does not swallow a real bullet list item that looks similar but doesn't match the quote pattern", () => {
    const { parser, schema } = makeManager();
    const doc = parser.parse("- just a regular bullet point");
    expect(doc.child(0).type).toBe(schema.nodes.bullet_list);
  });

  it("caps tags at 3 on round-trip (matches formatQuoteAsMarkdown's cap)", () => {
    const { parser, serializer } = makeManager();
    const line = formatQuoteAsMarkdown("Many tags", 0, 20, 1, ["a", "b", "c", "d"], false);
    const doc = parser.parse(line);
    expect(doc.child(0).attrs.tags).toEqual(["a", "b", "c"]);
    expect(serializer.serialize(doc)).toBe(line);
  });
});
