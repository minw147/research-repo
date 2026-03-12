// src/app/api/publish/adapters/adapters.test.ts
import { describe, it, expect, vi } from "vitest";
import { GET } from "./route";
import { listAdapters } from "@/lib/adapters";

vi.mock("@/lib/adapters", () => ({
  listAdapters: vi.fn(),
}));

describe("Adapters List API", () => {
  it("should return the list of adapters", async () => {
    const mockAdapters = [
      {
        id: "local-folder",
        name: "Local Folder",
        description: "Copy to local folder",
        icon: "Folder",
        configSchema: [],
      },
    ];
    (listAdapters as any).mockReturnValue(mockAdapters);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual(mockAdapters);
  });

  it("should return 500 if listAdapters fails", async () => {
    (listAdapters as any).mockImplementation(() => {
      throw new Error("Failed to list");
    });

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.message).toBe("Failed to list");
  });
});
