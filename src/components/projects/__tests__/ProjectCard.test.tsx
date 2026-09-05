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

it("status row renders a colored dot alongside the label", () => {
  render(<ProjectCard project={base} />);
  const label = screen.getByText("Setup");
  const dot = label.parentElement?.querySelector("span.rounded-full");
  expect(dot).toBeTruthy();
});
