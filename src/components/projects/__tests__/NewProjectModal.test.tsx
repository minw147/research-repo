import { render, screen, fireEvent } from "@testing-library/react";
import { afterEach, it, expect, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { NewProjectModal } from "../NewProjectModal";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));

afterEach(cleanup);

it("codebook step label is visible (not white-on-white)", async () => {
  render(<NewProjectModal />);
  // Open modal
  fireEvent.click(screen.getByRole("button", { name: /new project/i }));
  // Fill required fields
  fireEvent.change(screen.getByLabelText(/project title/i), { target: { value: "Test" } });
  fireEvent.change(screen.getByLabelText(/researcher/i), { target: { value: "Jane" } });
  fireEvent.change(screen.getByLabelText(/persona/i), { target: { value: "Admin" } });
  // Select custom codebook
  const selects = screen.getAllByRole("combobox");
  const codebookSelect = selects[selects.length - 1];
  fireEvent.change(codebookSelect, { target: { value: "custom" } });
  // Click Next to reach codebook step
  fireEvent.click(screen.getByRole("button", { name: /next/i }));
  // The upload label must be present and not white
  const label = screen.getByText(/upload codebook csv/i);
  expect(label.className).not.toContain("text-white");
});
