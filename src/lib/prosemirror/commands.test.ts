import { describe, it, expect } from "vitest";
import { EditorState, TextSelection } from "prosemirror-state";
import { pmSchema } from "./index";
import {
  isMarkActive,
  isNodeActive,
  isNodeActiveAnyAncestor,
  toggleHeading,
  toggleBold,
  toggleBulletList,
  toggleBlockquote,
  setLink,
} from "./commands";

function stateWithParagraph(text = "hello") {
  const doc = pmSchema.node("doc", null, [pmSchema.node("paragraph", null, pmSchema.text(text))]);
  return EditorState.create({ schema: pmSchema, doc, selection: TextSelection.create(doc, 1, 1 + text.length) });
}

describe("commands", () => {
  it("toggleBold applies and removes the strong mark on the selection", () => {
    let state = stateWithParagraph();
    expect(isMarkActive(state, pmSchema.marks.strong)).toBe(false);
    toggleBold()(state, (tr) => (state = state.apply(tr)));
    expect(isMarkActive(state, pmSchema.marks.strong)).toBe(true);
    toggleBold()(state, (tr) => (state = state.apply(tr)));
    expect(isMarkActive(state, pmSchema.marks.strong)).toBe(false);
  });

  it("toggleHeading converts a paragraph to h1 and back to paragraph", () => {
    let state = stateWithParagraph();
    toggleHeading(1)(state, (tr) => (state = state.apply(tr)));
    expect(isNodeActive(state, pmSchema.nodes.heading, { level: 1 })).toBe(true);
    toggleHeading(1)(state, (tr) => (state = state.apply(tr)));
    expect(isNodeActive(state, pmSchema.nodes.heading, { level: 1 })).toBe(false);
    expect(isNodeActive(state, pmSchema.nodes.paragraph)).toBe(true);
  });

  it("toggleBulletList wraps a paragraph in a bullet list and lifts it back out", () => {
    let state = stateWithParagraph();
    toggleBulletList()(state, (tr) => (state = state.apply(tr)));
    expect(isNodeActiveAnyAncestor(state, pmSchema.nodes.bullet_list)).toBe(true);
    toggleBulletList()(state, (tr) => (state = state.apply(tr)));
    expect(isNodeActiveAnyAncestor(state, pmSchema.nodes.bullet_list)).toBe(false);
  });

  it("toggleBlockquote wraps and lifts a paragraph", () => {
    let state = stateWithParagraph();
    toggleBlockquote()(state, (tr) => (state = state.apply(tr)));
    expect(isNodeActiveAnyAncestor(state, pmSchema.nodes.blockquote)).toBe(true);
    toggleBlockquote()(state, (tr) => (state = state.apply(tr)));
    expect(isNodeActiveAnyAncestor(state, pmSchema.nodes.blockquote)).toBe(false);
  });

  it("setLink expands to cover the whole existing link before replacing it", () => {
    const linkMark = pmSchema.marks.link.create({ href: "https://old.example.com" });
    const doc = pmSchema.node("doc", null, [
      pmSchema.node("paragraph", null, [
        pmSchema.text("before "),
        pmSchema.text("a link", [linkMark]),
        pmSchema.text(" after"),
      ]),
    ]);
    // Place an empty cursor selection in the middle of "a link".
    let state = EditorState.create({ schema: pmSchema, doc, selection: TextSelection.create(doc, 10, 10) });
    setLink("https://new.example.com")(state, (tr) => (state = state.apply(tr)));
    // The whole "a link" text should now carry the new href, "before "/" after" untouched.
    let sawNewHref = false;
    state.doc.descendants((node) => {
      if (node.isText && node.text === "a link") {
        const mark = pmSchema.marks.link.isInSet(node.marks);
        sawNewHref = mark?.attrs.href === "https://new.example.com";
      }
    });
    expect(sawNewHref).toBe(true);
  });
});
