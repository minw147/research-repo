import { render, screen } from "@testing-library/react";
import { afterEach, it, expect } from "vitest";
import { cleanup } from "@testing-library/react";
import { ProjectEmptyState } from "../ProjectEmptyState";

afterEach(cleanup);

it("uses amber icon background, not gray", () => {
  render(<ProjectEmptyState slug="test-project" onAddSession={() => {}} />);
  const iconWrapper = screen.getByTestId("empty-state-icon");
  expect(iconWrapper.className).toContain("bg-primary");
  expect(iconWrapper.className).not.toContain("bg-slate-200");
});

it("shows outcome-focused copy", () => {
  render(<ProjectEmptyState slug="test-project" onAddSession={() => {}} />);
  expect(screen.getByText(/start capturing insights/i)).toBeInTheDocument();
});

it("does not show raw folder path in main content", () => {
  render(<ProjectEmptyState slug="my-project" onAddSession={() => {}} />);
  expect(screen.queryByText(/content\/projects/i)).not.toBeInTheDocument();
});
