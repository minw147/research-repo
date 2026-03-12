import { useEffect } from "react";

export function useFileWatcher(
  slug: string,
  onFileChange: (file: string) => void
) {
  useEffect(() => {
    const eventSource = new EventSource(`/api/files/watch?slug=${slug}`);
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onFileChange(data.file);
    };
    eventSource.onerror = (err) => {
      console.error(`EventSource error for ${slug}:`, err);
      eventSource.close();
    };
    return () => eventSource.close();
  }, [slug, onFileChange]);
}
