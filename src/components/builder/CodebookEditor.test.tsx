import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CodebookEditor } from "./CodebookEditor";
import { Codebook } from "@/types";

describe("CodebookEditor", () => {
  const mockGlobalCodebook: Codebook = {
    tags: [
      { id: "global-1", label: "Global Tag 1", color: "#000", category: "Global" }
    ],
    categories: ["Global"]
  };

  const mockProjectCodebook: Codebook = {
    tags: [
      { id: "project-1", label: "Project Tag 1", color: "#FFF", category: "Project" }
    ],
    categories: ["Project"]
  };

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url === "/api/codebook/global") {
        return {
          ok: true,
          json: async () => mockGlobalCodebook
        };
      }
      return { ok: false };
    }));
  });

  afterEach(() => {
    cleanup();
  });

  it("renders merged codebook tags", async () => {
    render(
      <CodebookEditor
        projectCodebook={mockProjectCodebook}
        onSave={() => {}}
      />
    );

    expect(screen.getByText(/Loading codebooks.../i)).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText("Global Tag 1")).toBeDefined();
      expect(screen.getByText("Project Tag 1")).toBeDefined();
    });
  });

  it("calls onSave with updated custom tags when adding a tag", async () => {
    const onSave = vi.fn();
    render(
      <CodebookEditor
        projectCodebook={mockProjectCodebook}
        onSave={onSave}
      />
    );

    await waitFor(() => screen.getByText("Global Tag 1"));

    // Click "Add Custom Tag"
    fireEvent.click(screen.getByRole("button", { name: /Add Custom Tag/i }));

    // Fill form
    fireEvent.change(screen.getByLabelText(/Tag ID/i), { target: { value: "new-tag" } });
    fireEvent.change(screen.getByLabelText(/Label/i), { target: { value: "New Tag" } });
    const categorySelect = screen.getByLabelText(/Category/i);
    fireEvent.change(categorySelect, { target: { value: "Project" } });

    // Save tag
    fireEvent.click(screen.getByRole("button", { name: /Create Tag/i }));

    // Save codebook
    fireEvent.click(screen.getByRole("button", { name: /Save Codebook/i }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      tags: expect.arrayContaining([
        expect.objectContaining({ id: "project-1" }),
        expect.objectContaining({ id: "new-tag", label: "New Tag" })
      ])
    }));
  });

  it("renames a category and updates associated tags", async () => {
    const onSave = vi.fn();
    render(
      <CodebookEditor
        projectCodebook={mockProjectCodebook}
        onSave={onSave}
      />
    );

    await waitFor(() => screen.getByText("Global Tag 1"));

    // Click Edit on Project category
    fireEvent.click(screen.getByRole("button", { name: /Edit Project/i }));

    // Change category name
    const renameInput = screen.getByDisplayValue("Project");
    fireEvent.change(renameInput, { target: { value: "New Category Name" } });

    // Click Save
    fireEvent.click(screen.getByRole("button", { name: /^Save$/ }));

    // Click Save Codebook
    fireEvent.click(screen.getByRole("button", { name: /Save Codebook/i }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      categories: expect.arrayContaining(["New Category Name"]),
      tags: expect.arrayContaining([
        expect.objectContaining({ id: "project-1", category: "New Category Name" })
      ])
    }));
    
    // Verify old category is gone
    const savedCodebook = onSave.mock.calls[0][0];
    expect(savedCodebook.categories).not.toContain("Project");
  });

  it("calls onSaveGlobal instead of onSave when on the Global tab", async () => {
    const onSave = vi.fn();
    const onSaveGlobal = vi.fn().mockResolvedValue(undefined);
    const globalCodebook: Codebook = { tags: [], categories: [] };

    render(
      <CodebookEditor
        projectCodebook={mockProjectCodebook}
        showProjectTab={true}
        globalCodebook={globalCodebook}
        onSave={onSave}
        onSaveGlobal={onSaveGlobal}
      />
    );

    await waitFor(() => screen.getByText("Project Tag 1"));

    // Click "Global" tab
    fireEvent.click(screen.getByRole("button", { name: /global/i }));

    // Click "Save Codebook"
    fireEvent.click(screen.getByRole("button", { name: /save codebook/i }));

    expect(onSaveGlobal).toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
  });
});
