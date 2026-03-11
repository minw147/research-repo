import { describe, it, expect } from "vitest";
import { parseCsvCodebook } from "./csv-codebook";

describe("parseCsvCodebook", () => {
  it("parses valid CSV with header row", () => {
    const csv = "label,category\nUI Friction,Pain Point\nDelight Moment,Positive";
    const result = parseCsvCodebook(csv);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ label: "UI Friction", category: "Pain Point" });
  });

  it("returns empty category for missing value", () => {
    const csv = "label,category\nUI Friction,";
    const result = parseCsvCodebook(csv);
    expect(result[0].category).toBe("");
  });

  it("trims whitespace from values", () => {
    const csv = "label,category\n  UI Friction  ,  Pain Point  ";
    const result = parseCsvCodebook(csv);
    expect(result[0]).toMatchObject({ label: "UI Friction", category: "Pain Point" });
  });

  it("skips blank rows", () => {
    const csv = "label,category\nUI Friction,Pain Point\n\n";
    expect(parseCsvCodebook(csv)).toHaveLength(1);
  });

  it("throws if header row is missing required columns", () => {
    expect(() => parseCsvCodebook("name,type\nFoo,Bar")).toThrow();
  });
});
