// src/components/publish/PublishModal.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Share2,
  Box,
  FolderOpen,
  Copy,
  HelpCircle,
  ChevronLeft,
} from "lucide-react";
import * as Icons from "lucide-react";
import { AdapterConfigField, PublishAdapter } from "@/adapters/types";

interface PublishModalProps {
  slug: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PublishModal({ slug, isOpen, onClose, onSuccess }: PublishModalProps) {
  const [adapters, setAdapters] = useState<PublishAdapter[]>([]);
  const [selectedAdapter, setSelectedAdapter] = useState<PublishAdapter | null>(null);
  const [config, setConfig] = useState<Record<string, any>>({});
  const [configLoading, setConfigLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [pathCopied, setPathCopied] = useState(false);
  const [isPickerLoading, setIsPickerLoading] = useState(false);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [oauthStatus, setOauthStatus] = useState<Record<string, boolean>>({});
  const [openHelpKey, setOpenHelpKey] = useState<string | null>(null);
  const directoryInputRef = useRef<HTMLInputElement>(null);
  const pendingDirectoryFieldKeyRef = useRef<string | null>(null);
  const oauthPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const oauthTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function startOAuth(provider: string) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(config)) {
      if (v) params.set(k, v as string);
    }
    const res = await fetch(`/api/auth/${provider}?${params.toString()}`);
    if (!res.ok) { console.error("Failed to get auth URL"); return; }
    const { authUrl } = await res.json();
    window.open(authUrl, "_blank");

    oauthPollRef.current = setInterval(async () => {
      const statusRes = await fetch(`/api/auth/${provider}/status`);
      const { connected } = await statusRes.json();
      if (connected) {
        setOauthStatus(prev => ({ ...prev, [provider]: true }));
        if (oauthPollRef.current) clearInterval(oauthPollRef.current);
        if (oauthTimeoutRef.current) clearTimeout(oauthTimeoutRef.current);
      }
    }, 2000);

    oauthTimeoutRef.current = setTimeout(() => {
      if (oauthPollRef.current) clearInterval(oauthPollRef.current);
    }, 120_000);
  }

  const handleBrowseDirectory = (fieldKey: string) => async () => {
    if (typeof window === "undefined" || isPickerLoading) return;
    pendingDirectoryFieldKeyRef.current = fieldKey;
    setIsPickerLoading(true);
    setPickerError(null);
    try {
      const res = await fetch("/api/utils/folder-picker", { method: "POST" });
      const data = await res.json();
      if (data.path) {
        setConfig((prev) => ({ ...prev, [fieldKey]: data.path }));
        setIsPickerLoading(false);
        return;
      }
      if (data.cancelled) { setIsPickerLoading(false); return; }
      throw new Error(data.error || "Picker failed");
    } catch (err: any) {
      console.warn("Server-side picker failed:", err);
      setPickerError("Native picker unavailable. Please paste a path or use the browser fallback.");
    } finally {
      setIsPickerLoading(false);
    }
  };

  const handleBrowserFallback = (fieldKey: string) => async () => {
    if (typeof window === "undefined") return;
    const win = window as any;
    if (win.showDirectoryPicker && window.isSecureContext) {
      try {
        const handle = await win.showDirectoryPicker();
        setConfig((prev) => ({ ...prev, [fieldKey]: handle.name }));
        setPickerError(null);
      } catch (err: any) {
        if (err.name !== "AbortError") console.error("Browser picker failed:", err);
      }
    } else {
      const input = directoryInputRef.current;
      if (input) {
        pendingDirectoryFieldKeyRef.current = fieldKey;
        input.setAttribute("webkitdirectory", "");
        input.setAttribute("directory", "");
        input.value = "";
        input.click();
      }
    }
  };

  const handleDirectoryInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const key = pendingDirectoryFieldKeyRef.current;
    pendingDirectoryFieldKeyRef.current = null;
    const input = e.target;
    const files = input.files;
    let valueToSet: string | null = null;
    if (files && files.length > 0) {
      const f = files[0] as any;
      valueToSet = f.webkitRelativePath?.split("/")[0] || f.name || "";
    } else if (input.value) {
      valueToSet = input.value.replace(/^.*[/\\]/, "");
    }
    if (key && valueToSet) {
      setConfig((prev) => ({ ...prev, [key]: valueToSet }));
      setPickerError(null);
    }
    input.value = "";
  };

  useEffect(() => {
    if (isOpen) {
      fetch("/api/publish/adapters")
        .then((res) => res.json())
        .then((data) => { if (Array.isArray(data)) setAdapters(data); })
        .catch(() => setError("Failed to load publishing destinations."));
    } else {
      setSelectedAdapter(null);
      setConfig({});
      setError(null);
      setPublishedUrl(null);
      setPathCopied(false);
      setOpenHelpKey(null);
      if (oauthPollRef.current) clearInterval(oauthPollRef.current);
      if (oauthTimeoutRef.current) clearTimeout(oauthTimeoutRef.current);
    }
  }, [isOpen]);

  // Load saved config whenever an adapter is selected
  useEffect(() => {
    if (!selectedAdapter) return;
    setConfigLoading(true);
    fetch(`/api/adapter-config?adapterId=${selectedAdapter.id}`)
      .then((res) => res.json())
      .then((saved) => setConfig(saved ?? {}))
      .catch(() => {})
      .finally(() => setConfigLoading(false));
  }, [selectedAdapter]);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdapter) return;
    setIsPublishing(true);
    setError(null);
    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, adapterId: selectedAdapter.id, config }),
      });
      const data = await res.json();
      if (data.success) {
        // Persist config (including secrets) to ~/.research-repo/adapter-config.json
        fetch("/api/adapter-config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adapterId: selectedAdapter.id, config }),
        }).catch(() => {});
        setPublishedUrl(data.url || null);
        onSuccess();
      } else {
        setError(data.message || "Publishing failed");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsPublishing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/50 backdrop-blur-sm sm:items-center sm:p-4">
      {/* Hidden input for directory picker fallback */}
      <input
        ref={directoryInputRef}
        type="file"
        className="hidden"
        tabIndex={-1}
        aria-hidden
        {...({ webkitdirectory: "", directory: "", mozdirectory: "" } as any)}
        multiple
        onChange={handleDirectoryInputChange}
      />

      <div
        className="w-full max-w-lg overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            {selectedAdapter && !publishedUrl ? (
              <button
                type="button"
                onClick={() => { setSelectedAdapter(null); setOpenHelpKey(null); setError(null); }}
                className="flex cursor-pointer items-center gap-1 text-sm font-medium text-slate-500 transition-colors hover:text-slate-800"
                aria-label="Back to adapters"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
            ) : (
              <>
                <Share2 className="h-4 w-4 text-primary" />
                <h2 className="text-base font-semibold text-slate-900">Publish Report</h2>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[80vh] overflow-y-auto">
          {/* ── Success state ── */}
          {publishedUrl ? (
            <div className="flex flex-col items-center gap-5 px-8 py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Published!</h3>
                <p className="mt-1 text-sm text-slate-500">Your report is now available at:</p>
              </div>

              <div className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="break-all text-sm text-slate-700">{publishedUrl}</p>
                <div className="mt-3 flex items-center justify-center gap-3">
                  {publishedUrl.startsWith("http") ? (
                    <a
                      href={publishedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    >
                      Open <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!publishedUrl) return;
                          try {
                            await navigator.clipboard.writeText(publishedUrl);
                            setPathCopied(true);
                            setTimeout(() => setPathCopied(false), 2000);
                          } catch {}
                        }}
                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        {pathCopied ? "Copied!" : "Copy path"}
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!publishedUrl) return;
                          try {
                            await fetch("/api/utils/open-folder", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ path: publishedUrl }),
                            });
                          } catch {}
                        }}
                        className="flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                      >
                        <FolderOpen className="h-3.5 w-3.5" />
                        Open folder
                      </button>
                    </>
                  )}
                </div>
              </div>

              <button
                onClick={onClose}
                className="cursor-pointer text-sm font-medium text-slate-500 underline underline-offset-2 transition-colors hover:text-slate-800"
              >
                Done
              </button>
            </div>

          /* ── Adapter picker ── */
          ) : !selectedAdapter ? (
            <div className="p-6">
              {error && (
                <div className="mb-4 flex items-center gap-2.5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}
              <p className="mb-4 text-sm text-slate-500">Choose where to publish your report:</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {adapters.map((adapter) => {
                  const Icon = (Icons as any)[adapter.icon] || Box;
                  return (
                    <button
                      key={adapter.id}
                      onClick={() => setSelectedAdapter(adapter)}
                      className="group flex cursor-pointer flex-col items-start gap-3 rounded-xl border-2 border-slate-100 bg-white p-5 text-left transition-all hover:border-primary/30 hover:bg-primary/5"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 transition-colors group-hover:bg-primary/10">
                        <Icon className="h-4 w-4 text-slate-500 transition-colors group-hover:text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{adapter.name}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{adapter.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          /* ── Config form ── */
          ) : configLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
            </div>
          ) : (
            <form onSubmit={handlePublish} className="flex flex-col">
              {/* Adapter header */}
              <div className="border-b border-slate-100 px-6 py-4">
                <div className="flex items-center gap-3">
                  {(() => {
                    const Icon = (Icons as any)[selectedAdapter.icon] || Box;
                    return (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                    );
                  })()}
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{selectedAdapter.name}</p>
                    <p className="text-xs text-slate-400">{selectedAdapter.description}</p>
                  </div>
                </div>
              </div>

              {/* Fields */}
              <div className="space-y-5 px-6 py-5">
                {selectedAdapter.configSchema.map((field) => {
                  const oauthProvider = field.type === "oauth" ? (field.provider ?? selectedAdapter.id) : "";
                  return (
                    <div key={field.key}>
                      {/* Label row */}
                      <div className="mb-1.5 flex items-center gap-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          {field.label}
                          {field.required && field.type !== "oauth" && (
                            <span className="ml-1 text-red-400">*</span>
                          )}
                        </label>
                        {field.help && (
                          <button
                            type="button"
                            aria-label={`Help for ${field.label}`}
                            onClick={() => setOpenHelpKey(openHelpKey === field.key ? null : field.key)}
                            className="cursor-pointer text-slate-300 transition-colors hover:text-primary"
                          >
                            <HelpCircle className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Help popover */}
                      {openHelpKey === field.key && field.help && (
                        <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <p className="mb-2.5 text-xs font-semibold text-slate-700">{field.help.title}</p>
                          <ol className="space-y-2">
                            {field.help.steps.map((step, i) => (
                              <li key={i} className="flex gap-2.5">
                                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                                  {i + 1}
                                </span>
                                <span className="text-xs leading-relaxed text-slate-600">
                                  {step.url ? (
                                    <a
                                      href={step.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="font-medium text-primary underline underline-offset-2 hover:opacity-80"
                                    >
                                      {step.text}
                                    </a>
                                  ) : (
                                    step.text
                                  )}
                                </span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {/* Field input */}
                      {field.type === "select" ? (
                        <select
                          required={field.required}
                          className="w-full cursor-pointer appearance-none rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          value={config[field.key] || ""}
                          onChange={(e) => setConfig({ ...config, [field.key]: e.target.value })}
                        >
                          <option value="">Select an option…</option>
                          {field.options?.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>

                      ) : field.type === "path" ? (
                        <div className="space-y-1.5">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              required={field.required}
                              placeholder={field.placeholder}
                              className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                              value={config[field.key] || ""}
                              onChange={(e) => setConfig({ ...config, [field.key]: e.target.value })}
                            />
                            <button
                              type="button"
                              onClick={handleBrowseDirectory(field.key)}
                              disabled={isPickerLoading}
                              className="flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-wait disabled:opacity-50"
                            >
                              {isPickerLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <FolderOpen className="h-4 w-4" />
                              )}
                              {isPickerLoading ? "Opening…" : "Browse"}
                            </button>
                          </div>
                          {pickerError ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-amber-600">{pickerError}</span>
                              <button
                                type="button"
                                onClick={handleBrowserFallback(field.key)}
                                className="cursor-pointer text-xs font-semibold text-primary underline underline-offset-2"
                              >
                                Try browser picker
                              </button>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400">
                              Use Browse for an absolute path, or paste one manually.
                            </p>
                          )}
                        </div>

                      ) : field.type === "oauth" ? (
                        <div className="flex items-center gap-3">
                          {oauthStatus[oauthProvider] ? (
                            <>
                              <div className="flex items-center gap-1.5 text-sm font-medium text-green-600">
                                <CheckCircle2 className="h-4 w-4" />
                                Connected
                              </div>
                              <button
                                type="button"
                                className="cursor-pointer text-xs text-slate-400 underline underline-offset-2 transition-colors hover:text-slate-600"
                                onClick={async () => {
                                  await fetch(`/api/auth/${oauthProvider}/status`, { method: "DELETE" });
                                  setOauthStatus(prev => ({ ...prev, [oauthProvider]: false }));
                                }}
                              >
                                Disconnect
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              className="flex cursor-pointer items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
                              onClick={() => startOAuth(oauthProvider)}
                            >
                              Connect
                            </button>
                          )}
                        </div>

                      ) : (
                        <input
                          type={field.type === "password" ? "password" : "text"}
                          required={field.required}
                          placeholder={field.placeholder}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          value={config[field.key] || ""}
                          onChange={(e) => setConfig({ ...config, [field.key]: e.target.value })}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Error */}
              {error && (
                <div className="mx-6 mb-2 flex items-start gap-2.5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Footer */}
              {(() => {
                const oauthField = selectedAdapter?.configSchema.find(f => f.type === "oauth");
                const oauthProvider = oauthField?.provider ?? selectedAdapter?.id ?? "";
                const oauthConnected = !oauthField || oauthStatus[oauthProvider] === true;
                return (
                  <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isPublishing || !oauthConnected}
                      className="flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary/90 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {isPublishing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Publishing…
                        </>
                      ) : (
                        "Publish Report"
                      )}
                    </button>
                  </div>
                );
              })()}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
