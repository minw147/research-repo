/**
 * Converts a human-readable label to a URL-safe slug.
 * Performs lowercase conversion, strips special characters, and converts spaces to hyphens.
 * @param label The human-readable label to slugify
 * @returns A URL-safe slug (lowercase, no special chars, hyphens instead of spaces)
 */
export function slugifyLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/**
 * Generates a unique tag ID by slugifying the label and appending a numeric suffix if needed.
 * @param label The human-readable tag name to generate an ID from
 * @param existingIds Already-generated IDs in their final slug form (e.g., ["ui-friction", "ui-friction-2"]).
 *                    Must contain slugified IDs, NOT original labels.
 * @returns The label slugified, with `-2`, `-3`, etc. suffix appended if the slug already exists in existingIds
 */
export function generateTagId(label: string, existingIds: string[]): string {
  const base = slugifyLabel(label);
  if (!existingIds.includes(base)) return base;
  let n = 2;
  while (existingIds.includes(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}
