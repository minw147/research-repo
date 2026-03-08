// src/components/publish/PublishModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, CheckCircle, AlertCircle, ExternalLink, Share2, Box } from "lucide-react";
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
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <Share2 className="w-5 h-5 text-blue-600" />
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
                <a 
                  href={publishedUrl.startsWith('http') ? publishedUrl : `file://${publishedUrl}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 whitespace-nowrap"
                >
                  Open <ExternalLink className="w-4 h-4" />
                </a>
              </div>

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
                      className="flex flex-col items-start p-6 text-left border-2 border-slate-100 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center mb-4 transition-colors">
                        <Icon className="w-5 h-5 text-slate-600 group-hover:text-blue-600" />
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
                  className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1"
                >
                  &larr; Back to adapters
                </button>
              </div>

              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
                {(() => {
                  const Icon = (Icons as any)[selectedAdapter.icon] || Box;
                  return <Icon className="w-5 h-5 text-blue-600" />;
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
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 appearance-none"
                        value={config[field.key] || ""}
                        onChange={(e) => setConfig({ ...config, [field.key]: e.target.value })}
                      >
                        <option value="">Select an option...</option>
                        {field.options?.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type === "password" ? "password" : "text"}
                        required={field.required}
                        placeholder={field.placeholder}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 placeholder:text-slate-400"
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
                  disabled={isPublishing}
                  className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-md shadow-blue-500/20"
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
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
