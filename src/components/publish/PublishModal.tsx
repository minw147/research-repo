// src/components/publish/PublishModal.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Loader2, CheckCircle, AlertCircle, ExternalLink, Share2, Box, FolderOpen, Copy } from "lucide-react";
import * as Icons from "lucide-react";

import { AdapterConfigField, PublishAdapter } from "@/adapters/types";

interface PublishModalProps {
  slug: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (url: string) => void;
}

export function PublishModal({ slug, isOpen, onClose, onSuccess }: PublishModalProps) {
  const [adapters, setAdapters] = useState<PublishAdapter[]>([]);
  const [selectedAdapter, setSelectedAdapter] = useState<PublishAdapter | null>(null);
  const [config, setConfig] = useState<Record<string, any>>({});
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [pathCopied, setPathCopied] = useState(false);
  const [isPickerLoading, setIsPickerLoading] = useState(false);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [oauthStatus, setOauthStatus] = useState<Record<string, boolean>>({});
  const directoryInputRef = useRef<HTMLInputElement>(null);
  const pendingDirectoryFieldKeyRef = useRef<string | null>(null);
  const oauthPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const oauthTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function startOAuth(provider: string) {
    // Build query string from current config values
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(config)) {
      if (v) params.set(k, v as string);
    }

    const res = await fetch(`/api/auth/${provider}?${params.toString()}`);
    if (!res.ok) {
      console.error("Failed to get auth URL");
      return;
    }
    const { authUrl } = await res.json();
    window.open(authUrl, "_blank");

    // Poll for connection status every 2 seconds for up to 2 minutes
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

  // Refined directory picker: prefer server-side native picker for real absolute paths
  const handleBrowseDirectory = (fieldKey: string) => async () => {
    if (typeof window === "undefined" || isPickerLoading) return;
    console.log("Browse directory requested for field:", fieldKey);
    pendingDirectoryFieldKeyRef.current = fieldKey;
    setIsPickerLoading(true);
    setPickerError(null);

    // 1. Try server-side native picker first (best for local dev, gives absolute path)
    try {
      console.log("Attempting server-side native folder picker...");
      const res = await fetch("/api/utils/folder-picker", { method: "POST" });
      const data = await res.json();
      if (data.path) {
        console.log("Server-side picker success:", data.path);
        setConfig((prev) => ({ ...prev, [fieldKey]: data.path }));
        setIsPickerLoading(false);
        return;
      }
      if (data.cancelled) {
        console.log("Server-side picker cancelled.");
        setIsPickerLoading(false);
        return;
      }
      throw new Error(data.error || "Picker failed");
    } catch (err: any) {
      console.warn("Server-side picker failed:", err);
      setPickerError("Native picker unavailable. Please paste path or use fallback.");
    } finally {
      setIsPickerLoading(false);
    }
  };

  // Explicit fallback trigger to avoid user gesture issues
  const handleBrowserFallback = (fieldKey: string) => async () => {
    if (typeof window === "undefined") return;
    console.log("Browser fallback requested for field:", fieldKey);
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
      // Last resort: input fallback (folder name only)
      // Since we need to trigger this via user gesture, we rely on the button click
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
        .then((data) => {
          if (Array.isArray(data)) {
            setAdapters(data);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch adapters", err);
          setError("Failed to load publishing destinations.");
        });
    } else {
      // Reset state when closing
      setSelectedAdapter(null);
      setConfig({});
      setError(null);
      setPublishedUrl(null);
      setPathCopied(false);
      if (oauthPollRef.current) clearInterval(oauthPollRef.current);
      if (oauthTimeoutRef.current) clearTimeout(oauthTimeoutRef.current);
    }
  }, [isOpen]);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdapter) return;

    setIsPublishing(true);
    setError(null);

    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          adapterId: selectedAdapter.id,
          config,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPublishedUrl(data.url || null);
        onSuccess(data.url || "");
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
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
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <Share2 className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-slate-900">Publish Report</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {publishedUrl ? (
            <div className="text-center py-8 space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-2">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-slate-900">Successfully Published!</h3>
                <p className="text-slate-500">Your report is now live at the following destination:</p>
              </div>
              
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <code className="text-sm text-slate-700 truncate block w-full text-center sm:text-left">
                  {publishedUrl}
                </code>
                <div className="flex items-center gap-2 shrink-0">
                  {publishedUrl.startsWith("http") ? (
                    <a
                      href={publishedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary font-semibold hover:text-blue-700 whitespace-nowrap cursor-pointer"
                    >
                      Open <ExternalLink className="w-4 h-4" />
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
                          } catch {
                            setPathCopied(false);
                          }
                        }}
                        className="flex items-center gap-2 text-slate-700 font-medium hover:text-slate-900 whitespace-nowrap cursor-pointer"
                      >
                        <Copy className="w-4 h-4" />
                        {pathCopied ? "Copied!" : "Copy path"}
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!publishedUrl) return;
                          try {
                            const res = await fetch("/api/utils/open-folder", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ path: publishedUrl }),
                            });
                            if (!res.ok) {
                              const data = await res.json().catch(() => ({}));
                              console.warn("Open folder failed:", data?.error);
                            }
                          } catch (e) {
                            console.warn("Open folder failed:", e);
                          }
                        }}
                        className="flex items-center gap-2 text-primary font-semibold hover:text-blue-700 whitespace-nowrap cursor-pointer"
                      >
                        <FolderOpen className="w-4 h-4" />
                        Open folder
                      </button>
                    </>
                  )}
                </div>
              </div>
              {publishedUrl && !publishedUrl.startsWith("http") && (
                <p className="text-xs text-slate-500 text-center">
                  Open <strong>index.html</strong> in the folder to view the report in your browser.
                </p>
              )}

              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-all shadow-md"
              >
                Close
              </button>
            </div>
          ) : !selectedAdapter ? (
            <div className="space-y-6">
              <p className="text-slate-500">Choose where you want to publish your report:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {adapters.map((adapter) => {
                  const Icon = (Icons as any)[adapter.icon] || Box;
                  return (
                    <button
                      key={adapter.id}
                      onClick={() => setSelectedAdapter(adapter)}
                      className="flex flex-col items-start p-6 text-left border-2 border-slate-100 rounded-xl hover:border-primary/40 hover:bg-primary/5 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-slate-100 group-hover:bg-primary/10 flex items-center justify-center mb-4 transition-colors">
                        <Icon className="w-5 h-5 text-slate-600 group-hover:text-primary" />
                      </div>
                      <h4 className="font-bold text-slate-900 mb-1">{adapter.name}</h4>
                      <p className="text-sm text-slate-500">{adapter.description}</p>
                    </button>
                  );
                })}
              </div>
              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-lg flex items-center gap-3 text-red-600 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handlePublish} className="space-y-6">
              <div className="flex items-center gap-4 mb-4">
                <button
                  type="button"
                  onClick={() => setSelectedAdapter(null)}
                  className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
                >
                  &larr; Back to adapters
                </button>
              </div>

              <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-lg border border-primary/20">
                {(() => {
                  const Icon = (Icons as any)[selectedAdapter.icon] || Box;
                  return <Icon className="w-5 h-5 text-primary" />;
                })()}
                <div>
                  <h4 className="font-bold text-slate-900">{selectedAdapter.name}</h4>
                  <p className="text-xs text-slate-500">{selectedAdapter.description}</p>
                </div>
              </div>

              <div className="space-y-4">
                {selectedAdapter.configSchema.map((field) => (
                  <div key={field.key} className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {field.label} {field.required && "*"}
                    </label>
                    {field.type === "select" ? (
                      <select
                        required={field.required}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 appearance-none"
                        value={config[field.key] || ""}
                        onChange={(e) => setConfig({ ...config, [field.key]: e.target.value })}
                      >
                        <option value="">Select an option...</option>
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
                            className="flex-1 min-w-0 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 placeholder:text-slate-400"
                            value={config[field.key] || ""}
                            onChange={(e) => setConfig({ ...config, [field.key]: e.target.value })}
                            aria-describedby={field.key + "-hint"}
                          />
                          <button
                            type="button"
                            onClick={handleBrowseDirectory(field.key)}
                            disabled={isPickerLoading}
                            className="flex items-center gap-2 shrink-0 px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-wait"
                            title="Choose destination folder using native picker"
                          >
                            {isPickerLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <FolderOpen className="w-4 h-4" />
                            )}
                            {isPickerLoading ? "Opening..." : "Browse"}
                          </button>
                        </div>
                        {pickerError ? (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-amber-600 font-medium">{pickerError}</span>
                            <button
                              type="button"
                              onClick={handleBrowserFallback(field.key)}
                              className="text-xs text-primary font-bold hover:underline"
                            >
                              Try browser picker instead
                            </button>
                          </div>
                        ) : (
                          <p id={field.key + "-hint"} className="text-xs text-slate-500">
                            Choose where to store the export. Native picker provides real absolute paths.
                          </p>
                        )}
                      </div>
                    ) : field.type === "oauth" ? (
                      <div className="flex items-center gap-3">
                        {oauthStatus[selectedAdapter.id] ? (
                          <>
                            <span className="text-sm text-green-600 font-medium">Connected ✓</span>
                            <button
                              type="button"
                              className="text-xs text-slate-500 underline hover:text-slate-700"
                              onClick={async () => {
                                await fetch(`/api/auth/${selectedAdapter.id}/status`, { method: "DELETE" });
                                setOauthStatus(prev => ({ ...prev, [selectedAdapter.id]: false }));
                              }}
                            >
                              Disconnect
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="px-3 py-1.5 text-xs font-semibold bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors"
                            onClick={() => startOAuth(selectedAdapter.id)}
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
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 placeholder:text-slate-400"
                        value={config[field.key] || ""}
                        onChange={(e) => setConfig({ ...config, [field.key]: e.target.value })}
                      />
                    )}
                  </div>
                ))}
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-lg flex items-center gap-3 text-red-600 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {(() => {
                const requiresOAuth = selectedAdapter?.configSchema.some(f => f.type === "oauth") ?? false;
                const oauthConnected = !requiresOAuth || oauthStatus[selectedAdapter.id] === true;
                return (
              <div className="pt-6 flex items-center justify-end gap-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-slate-500 hover:text-slate-800 font-medium px-2 py-1 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPublishing || !oauthConnected}
                  className="px-6 py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-md shadow-primary/20"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Publishing...
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
