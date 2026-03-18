import { render, screen } from "@testing-library/react";
import { afterEach, it, expect, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { ProjectCard } from "../ProjectCard";
import type { Project } from "@/types";

vi.mock("next/link", () => ({
  default: ({ href, children, className }: any) => <a href={href} className={className}>{children}</a>,
}));

afterEach(cleanup);

const base: Project = {
  id: "test", title: "Test", date: "2026-01-01",
  researcher: "Jane", persona: "Admin", status: "setup", sessions: [],
};

it("status badge renders an svg icon alongside the text", () => {
  render(<ProjectCard project={base} />);
  const badge = screen.getByText("setup");
  expect(badge.querySelector("svg") || badge.parentElement?.querySelector("svg")).toBeTruthy();
});
