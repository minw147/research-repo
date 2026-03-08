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
    return () => eventSource.close();
  }, [slug, onFileChange]);
}
