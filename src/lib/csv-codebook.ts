export interface CsvRow {
  label: string;
  category: string;
}

export function parseCsvCodebook(csv: string): CsvRow[] {
  const lines = csv.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const labelIdx = headers.indexOf("label");
  const categoryIdx = headers.indexOf("category");

  if (labelIdx === -1 || categoryIdx === -1) {
    throw new Error('CSV must have "label" and "category" columns');
  }

  return lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim());
    return {
      label: cols[labelIdx] ?? "",
      category: cols[categoryIdx] ?? "",
    };
  }).filter((row) => row.label.length > 0);
}
