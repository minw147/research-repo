import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PromptModal } from "./PromptModal";
import type { Project, Codebook } from "@/types";

const mockProject: Project = {
  id: "test-project",
  title: "Test Project",
  date: "2026-03-08",
  researcher: "Jane Doe",
  persona: "Busy professional",
  product: "Task App",
  status: "setup",
  researchPlan: "Test research.",
  codebook: null,
  sessions: [{ id: "s1", participant: "P1", videoFile: "v1.mp4", transcriptFile: "t1.txt" }],
  publishedUrl: null,
};

const mockCodebook: Codebook = {
  tags: [{ id: "t1", label: "Tag A", color: "#F00", category: "Cat1" }],
  categories: ["Cat1"],
};

const mockOnClose = vi.fn();

describe("PromptModal", () => {
  beforeEach(() => {
    vi.stubGlobal("navigator", {
      clipboard: { writeText: vi.fn() },
    });
    vi.clearAllMocks();
  });

  it("renders action options and prompt textarea", () => {
    render(
      <PromptModal project={mockProject} codebook={mockCodebook} onClose={mockOnClose} />
    );

    expect(screen.getByText("AI Analysis")).toBeDefined();
    expect(screen.getByText("Initial Findings")).toBeDefined();
    expect(screen.getByText("Refine Findings")).toBeDefined();
    expect(screen.getByLabelText(/generated prompt/i)).toBeDefined();
    expect(screen.getByText("Done")).toBeDefined();
  });

  it("shows findings.md hint when findings action is selected", () => {
    const { container } = render(
      <PromptModal project={mockProject} codebook={mockCodebook} onClose={mockOnClose} />
    );
    expect(container.textContent).toContain("findings.md");
  });

  it("shows tags.md hint when tagging action is selected", () => {
    const { container } = render(
      <PromptModal
        project={mockProject}
        codebook={mockCodebook}
        onClose={mockOnClose}
        initialAction="tagging-findings"
        actions={["tagging-findings"]}
      />
    );
    expect(container.textContent).toContain("tags.md");
  });

  it("calls clipboard.writeText when Copy is clicked", () => {
    const writeText = vi.fn();
    Object.assign(navigator, { clipboard: { writeText } });

    render(
      <PromptModal project={mockProject} codebook={mockCodebook} onClose={mockOnClose} />
    );

    const copyButtons = screen.getAllByRole("button", { name: /Copy/i });
    fireEvent.click(copyButtons[0]);
    expect(writeText).toHaveBeenCalled();
    expect(writeText.mock.calls[0][0]).toContain("findings.md");
    expect(writeText.mock.calls[0][0]).toContain("Test Project");
  });

  it("calls onClose when Done is clicked", () => {
    render(
      <PromptModal project={mockProject} codebook={mockCodebook} onClose={mockOnClose} />
    );

    const doneButtons = screen.getAllByRole("button", { name: "Done" });
    fireEvent.click(doneButtons[0]);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("renders report-generation actions when passed report actions", () => {
    render(
      <PromptModal
        project={mockProject}
        codebook={mockCodebook}
        onClose={mockOnClose}
        initialAction="report-generation"
        actions={["report-generation"]}
        reportStyle="blog"
      />
    );

    expect(screen.getByText("AI synthesis")).toBeDefined();
    expect(screen.getAllByText(/findings\.html/).length).toBeGreaterThan(0);
  });

  it("renders change-theme action and theme grid with color previews", () => {
    render(
      <PromptModal
        project={mockProject}
        codebook={mockCodebook}
        onClose={mockOnClose}
        initialAction="change-theme"
        actions={["report-generation", "change-theme", "other-templates"]}
        otherTemplateContext="report"
      />
    );

    expect(screen.getByText("Change color theme")).toBeDefined();
    expect(screen.getByText("Choose a theme")).toBeDefined();
    expect(screen.getByText("Burnt Orange")).toBeDefined();
    expect(screen.getByText("Deep Purple & Emerald")).toBeDefined();
  });
});
