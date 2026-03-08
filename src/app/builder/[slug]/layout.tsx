// src/app/builder/[slug]/layout.tsx
import { WorkspaceNav } from "@/components/builder/WorkspaceNav";

export default function BuilderLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  return (
    <div className="flex h-screen flex-col bg-slate-50">
      <WorkspaceNav slug={params.slug} />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
