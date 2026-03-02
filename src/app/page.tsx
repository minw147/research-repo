import Link from "next/link";
import { format } from "date-fns";
import { getAllStudies } from "@/lib/db";

export default function DashboardPage() {
  const studies = getAllStudies();
  const recent = [...studies]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-slate-600">
          Overview of your research repository
        </p>
      </header>

      {recent.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Recent Reports
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((study) => (
              <Link
                key={study.id}
                href={`/reports/${study.reportFile.replace(/\.mdx?$/, "")}`}
                className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
              >
                <h3 className="font-semibold text-slate-900 group-hover:text-primary">
                  {study.title}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {format(new Date(study.date), "MMM d, yyyy")}
                </p>
                <span className="mt-2 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  {study.persona}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {studies.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <p className="text-slate-600">No reports yet.</p>
          <p className="mt-1 text-sm text-slate-500">
            Add entries to{" "}
            <code className="rounded bg-slate-200 px-1">
              data/research-index.json
            </code>{" "}
            and reports to{" "}
            <code className="rounded bg-slate-200 px-1">content/reports/</code>
          </p>
        </div>
      )}
    </div>
  );
}
