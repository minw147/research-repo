"use client";

import { DocumentWorkspace } from "@/components/builder/DocumentWorkspace";

interface FindingsPageProps {
  params: {
    slug: string;
  };
}

export default function FindingsPage({ params }: FindingsPageProps) {
  const { slug } = params;
  return <DocumentWorkspace slug={slug} defaultFile="findings.md" />;
}
