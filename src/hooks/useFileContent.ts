import { useState, useCallback, useEffect } from "react";

export function useFileContent(slug: string, file: string) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/files?slug=${slug}&file=${file}`);
      if (!res.ok) throw new Error(`Failed to fetch ${file}`);
      const data = await res.json();
      setContent(data.content);
    } catch (err: any) {
      setError(err.message);
      console.error(`Error fetching ${file}:`, err);
    } finally {
      setLoading(false);
    }
  }, [slug, file]);

  useEffect(() => { fetchContent(); }, [fetchContent]);

  const saveContent = useCallback(async (newContent: string) => {
    setError(null);
    try {
      const res = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, file, content: newContent }),
      });
      if (!res.ok) throw new Error(`Failed to save ${file}`);
      setContent(newContent);
    } catch (err: any) {
      setError(err.message);
      console.error(`Error saving ${file}:`, err);
    }
  }, [slug, file]);

  return { content, loading, error, refetch: fetchContent, saveContent };
}
