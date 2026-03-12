"use client";

import { DocumentWorkspace } from "@/components/builder/DocumentWorkspace";

interface TagsPageProps {
  params: {
    slug: string;
  };
}

export default function TagsPage({ params }: TagsPageProps) {
  const { slug } = params;
  return <DocumentWorkspace slug={slug} defaultFile="tags.md" />;
}
