// src/app/builder/[slug]/layout.tsx

export default function BuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col bg-[#f6f5f4]">
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
