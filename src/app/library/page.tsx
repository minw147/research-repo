import { Suspense } from "react";
import { getAllStudiesWithContent } from "@/lib/db";
import { LibraryClient } from "./LibraryClient";

export default function LibraryPage() {
  const studies = getAllStudiesWithContent();

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Library</h1>
        <p className="mt-1 text-slate-600">
          All reports with search and filters
        </p>
      </header>

      <Suspense fallback={<div className="text-slate-500">Loading...</div>}>
        <LibraryClient studies={studies} />
      </Suspense>
    </div>
  );
}
