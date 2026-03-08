"use client";

import { useFileContent } from "@/hooks/useFileContent";
import { WorkspaceNav } from "@/components/builder/WorkspaceNav";
import { CodebookEditor } from "@/components/builder/CodebookEditor";
import { Codebook } from "@/types";

interface TagsPageProps {
  params: {
    slug: string;
  };
}

export default function TagsPage({ params }: TagsPageProps) {
  const { slug } = params;
  const { content, loading, error, saveContent } = useFileContent(slug, "codebook.json");

  const projectCodebook: Codebook | null = content ? JSON.parse(content) : null;

  const handleSave = async (newCodebook: Codebook) => {
    await saveContent(JSON.stringify(newCodebook, null, 2));
    alert("Codebook saved successfully!");
  };

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <WorkspaceNav slug={slug} />
        <div className="p-8 text-center text-red-500">
          Error loading codebook: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <WorkspaceNav slug={slug} />
      <main className="py-8">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading project codebook...</div>
        ) : (
          <CodebookEditor
            slug={slug}
            projectCodebook={projectCodebook}
            onSave={handleSave}
          />
        )}
      </main>
    </div>
  );
}
