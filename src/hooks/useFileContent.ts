import { useState, useCallback, useEffect } from "react";

export function useFileContent(slug: string, file: string) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchContent = useCallback(async () => {
    const res = await fetch(`/api/files?slug=${slug}&file=${file}`);
    const data = await res.json();
    setContent(data.content);
    setLoading(false);
  }, [slug, file]);

  useEffect(() => { fetchContent(); }, [fetchContent]);

  const saveContent = useCallback(async (newContent: string) => {
    await fetch("/api/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, file, content: newContent }),
    });
    setContent(newContent);
  }, [slug, file]);

  return { content, loading, refetch: fetchContent, saveContent };
}
