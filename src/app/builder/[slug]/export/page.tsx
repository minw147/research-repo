"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Loader2,
  Share2,
  ExternalLink,
  FolderOpen,
  Trash2,
  AlertCircle,
  CloudUpload,
} from "lucide-react";
import { PublishModal } from "@/components/publish/PublishModal";
import { WorkspaceNav } from "@/components/builder/WorkspaceNav";
import { Project, PublishRecord } from "@/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ExportPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [project, setProject] = useState<Project | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null);

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${slug}`);
      if (res.ok) setProject(await res.json());
    } catch (err) {
      console.error("Failed to fetch project", err);
    }
  }, [slug]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const handleDeleteRecord = async (url: string) => {
    setDeletingUrl(url);
    try {
      await fetch("/api/publish", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, url }),
      });
      await fetchProject();
    } finally {
      setDeletingUrl(null);
    }
  };

  const canPublish = project?.status === "exported" || project?.status === "published";
  const records: PublishRecord[] = project?.publishedUrls ?? [];
  const isPublished = records.length > 0;

  if (!project) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <WorkspaceNav slug={slug} />
      <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-2xl px-6 py-10">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Cloud Storage</h1>
        <p className="mt-1 text-sm text-slate-500">
          Publish your exported report to a destination for stakeholders to access.
        </p>
      </div>

      <div className="space-y-4">
        {/* Export required notice */}
        {!canPublish && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <p className="text-sm text-amber-800">
              You need to{" "}
              <Link
                href={`/builder/${slug}/report`}
                className="font-semibold underline underline-offset-2 hover:text-amber-900"
              >
                export your report
              </Link>{" "}
              from the Report tab before publishing.
            </p>
          </div>
        )}

        {/* Publish card */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {/* Card header */}
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  isPublished
                    ? "bg-green-100 text-green-600"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {isPublished ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <CloudUpload className="h-5 w-5" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {isPublished ? "Published" : "Publish report"}
                </p>
                <p className="text-xs text-slate-400">
                  {isPublished
                    ? `${records.length} destination${records.length > 1 ? "s" : ""}`
                    : "Choose where to store your export"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsPublishModalOpen(true)}
              disabled={!canPublish}
              className="flex shrink-0 cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-[background-color,box-shadow] hover:bg-primary/90 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Share2 className="h-4 w-4" />
              {isPublished ? "Re-publish" : "Publish Report"}
            </button>
          </div>

          {/* Destination records */}
          {records.length > 0 && (
            <ul className="divide-y divide-slate-100">
              {records.map((record) => (
                <li key={record.url} className="flex items-center gap-4 px-6 py-4">
                  {/* Adapter badge */}
                  <div className="w-24 shrink-0">
                    <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      {record.adapterName}
                    </span>
                  </div>

                  {/* URL + date */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-700">{record.url}</p>
                    {record.publishedAt && (
                      <p className="mt-0.5 text-xs text-slate-400">{formatDate(record.publishedAt)}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-2">
                    {record.url.startsWith("http") ? (
                      <a
                        href={record.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                      >
                        View <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await fetch("/api/utils/open-folder", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ path: record.url }),
                            });
                          } catch (e) {
                            console.warn("Open folder failed:", e);
                          }
                        }}
                        className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                      >
                        <FolderOpen className="h-3 w-3" />
                        Open
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteRecord(record.url)}
                      disabled={deletingUrl === record.url}
                      aria-label="Remove publish record"
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
                    >
                      {deletingUrl === record.url ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Empty state when can publish but not yet */}
          {canPublish && !isPublished && (
            <div className="px-6 py-8 text-center">
              <p className="text-sm text-slate-400">
                No destinations yet — click <strong className="text-slate-500">Publish Report</strong> to get started.
              </p>
            </div>
          )}
        </div>

        {/* Pro tip */}
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-5 py-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Pro Tip</p>
          <p className="text-sm leading-relaxed text-slate-600">
            The exported <code className="rounded bg-slate-200 px-1 py-0.5 text-xs">/export</code> folder is
            fully portable. Zip it and upload to SharePoint, OneDrive, or Google Drive — stakeholders can view
            the report and watch video clips directly in their browser.
          </p>
        </div>
      </div>

      </div>
      </div>

      <PublishModal
        slug={slug}
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        onSuccess={() => fetchProject()}
      />
    </div>
  );
}
