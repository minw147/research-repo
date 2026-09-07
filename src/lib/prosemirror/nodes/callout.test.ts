import { describe, it, expect } from "vitest";
import { ExtensionManager } from "../extension-manager";
import { createStockNodeExtensions, createStockMarkExtensions } from "./stock";
import { CalloutExtension } from "./callout";

function makeManager() {
  return new ExtensionManager([...createStockNodeExtensions(), ...createStockMarkExtensions(), new CalloutExtension()]);
}

describe("CalloutExtension", () => {
  it("is a container block node with a calloutType attr defaulting to info", () => {
    const { schema } = makeManager();
    const callout = schema.nodes.callout;
    expect(callout.spec.group).toBe("block");
    expect(callout.spec.content).toBe("block+");
    expect(callout.spec.attrs?.calloutType.default).toBe("info");
  });

  it("parses a simple :::type ... ::: block into a callout node", () => {
    const { parser, schema } = makeManager();
    const doc = parser.parse(":::warning\nSome insight.\n:::");
    expect(doc.childCount).toBe(1);
    const callout = doc.child(0);
    expect(callout.type).toBe(schema.nodes.callout);
    expect(callout.attrs.calloutType).toBe("warning");
    expect(callout.textContent).toBe("Some insight.");
  });

  it("preserves per-paragraph nodes for multi-paragraph content inside the fence", () => {
    const { parser, schema } = makeManager();
    const doc = parser.parse(":::insight\nFirst paragraph.\n\nSecond paragraph.\n:::");
    const callout = doc.child(0);
    expect(callout.childCount).toBe(2);
    expect(callout.child(0).type).toBe(schema.nodes.paragraph);
    expect(callout.child(0).textContent).toBe("First paragraph.");
    expect(callout.child(1).type).toBe(schema.nodes.paragraph);
    expect(callout.child(1).textContent).toBe("Second paragraph.");
  });

  it("does not wrap an unclosed directive (no matching closing ':::') — falls through as plain text", () => {
    const { parser, schema } = makeManager();
    const doc = parser.parse(":::warning\nNever closed.");
    // No callout node anywhere in the doc.
    let sawCallout = false;
    doc.descendants((node) => {
      if (node.type === schema.nodes.callout) sawCallout = true;
    });
    expect(sawCallout).toBe(false);
  });

  it("does not match a bare ':::' fence with no type token", () => {
    const { parser, schema } = makeManager();
    const doc = parser.parse(":::\nsomething\n:::");
    let sawCallout = false;
    doc.descendants((node) => {
      if (node.type === schema.nodes.callout) sawCallout = true;
    });
    expect(sawCallout).toBe(false);
  });

  it("defaults calloutType to info when missing (serialize side)", () => {
    const { schema, serializer } = makeManager();
    const node = schema.nodes.callout.create({}, schema.nodes.paragraph.create(null, schema.text("hi")));
    const doc = schema.nodes.doc.create(null, [node]);
    expect(serializer.serialize(doc)).toBe(":::info\nhi\n:::");
  });

  it("round-trips a callout through parse + serialize byte-for-byte", () => {
    const { parser, serializer } = makeManager();
    const md = ":::insight\nIf you remember one lens, make it *roofline*.\n:::";
    expect(serializer.serialize(parser.parse(md))).toBe(md);
  });

  it("leaves unrelated markdown (headings, paragraphs) untouched", () => {
    const { parser, serializer } = makeManager();
    const md = "# A heading\n\nA normal paragraph.";
    expect(serializer.serialize(parser.parse(md))).toBe(md);
  });
});
