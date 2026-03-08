// src/app/builder/[slug]/page.tsx
import { redirect } from "next/navigation";

export default function BuilderPage({ params }: { params: { slug: string } }) {
  redirect(`/builder/${params.slug}/findings`);
}
