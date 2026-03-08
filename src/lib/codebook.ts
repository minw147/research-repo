// src/lib/codebook.ts
import type { Codebook, CodebookTag } from "@/types";

export function mergeCodebooks(
  global: Codebook,
  custom: Codebook | null
): Codebook {
  if (!custom) return global;

  const tagMap = new Map<string, CodebookTag>();
  for (const tag of global.tags) tagMap.set(tag.id, tag);
  for (const tag of custom.tags) tagMap.set(tag.id, tag);

  const categories = [
    ...new Set([...global.categories, ...custom.categories]),
  ];

  return { tags: Array.from(tagMap.values()), categories };
}

export function getTagById(
  codebook: Codebook,
  id: string
): CodebookTag | null {
  return codebook.tags.find((t) => t.id === id) ?? null;
}
