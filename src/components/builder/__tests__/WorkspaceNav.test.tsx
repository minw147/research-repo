import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, it, expect, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { WorkspaceNav } from "../WorkspaceNav";

vi.mock("next/navigation", () => ({ usePathname: () => "/builder/test/findings" }));

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  cleanup();
});

it("home link does not use low-opacity focus ring", () => {
  render(<WorkspaceNav slug="test" />);
  const homeLink = screen.getByRole("link", { name: /research hub home/i });
  expect(homeLink.className).not.toContain("focus:ring-primary/20");
  expect(homeLink.className).toMatch(/focus:ring-primary(?!\/)/);
});

it("renders a skip-to-content link as first focusable element", () => {
  render(<WorkspaceNav slug="test" />);
  const skipLink = screen.getByRole("link", { name: /skip to content/i });
  expect(skipLink).toBeInTheDocument();
  expect(skipLink.getAttribute("href")).toBe("#main-content");
});
