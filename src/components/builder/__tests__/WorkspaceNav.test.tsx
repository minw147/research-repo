import { render, screen } from "@testing-library/react";
import { afterEach, it, expect, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { WorkspaceNav } from "../WorkspaceNav";

vi.mock("next/navigation", () => ({ usePathname: () => "/builder/test/findings" }));

afterEach(cleanup);

it("home link does not use low-opacity focus ring", () => {
  render(<WorkspaceNav slug="test" />);
  const homeLink = screen.getByRole("link", { name: /research hub home/i });
  expect(homeLink.className).not.toContain("focus:ring-primary/20");
  expect(homeLink.className).toMatch(/focus:ring-primary(?!\/)/);
});
