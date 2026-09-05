"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2, FolderPlus } from "lucide-react";
import { parseCsvCodebook } from "@/lib/csv-codebook";
import { generateTagId } from "@/lib/codebook-utils";
import { assignTagColor } from "@/lib/color-themes";

function CategoryCombobox({
  value,
  existingCategories,
  onChange,
}: {
  value: string;
  existingCategories: string[];
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState(value);

  useEffect(() => {
    setInput(value);
  }, [value]);

  const filtered = existingCategories.filter((c) =>
    c.toLowerCase().includes(input.toLowerCase())
  );

  return (
    <div className="relative">
      <input
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setTimeout(() => {
            setOpen(false);
            onChange(input);
          }, 150);
        }}
        placeholder="Select or type new..."
        className="w-full bg-transparent text-stone-900 text-sm border-b border-stone-300 focus:outline-none focus:border-primary py-0.5"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-10 top-full left-0 bg-white border border-stone-200 rounded shadow-dialog w-48 mt-1">
          {filtered.map((c) => (
            <button
              key={c}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setInput(c);
                onChange(c);
                setOpen(false);
              }}
              className="block w-full text-left px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50"
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewProjectModal({ isOpen, onClose }: NewProjectModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: "",
    researcher: "",
    persona: "",
    product: "",
    researchPlan: "",
    codebook: null as string | null,
  });

  const [step, setStep] = useState<"details" | "codebook">("details");
  const [csvRows, setCsvRows] = useState<
    Array<{
      label: string;
      category: string;
      id: string;
      color: string;
    }>
  >([]);
  const [newCategories, setNewCategories] = useState<string[]>([]);

  const handleClose = () => {
    setStep("details");
    setCsvRows([]);
    setNewCategories([]);
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const project = await res.json();
        // Reset form
        setFormData({
          title: "",
          researcher: "",
          persona: "",
          product: "",
          researchPlan: "",
          codebook: null,
        });
        handleClose();
        router.push(`/builder/${project.id}/findings`);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(
          (errData as { message?: string }).message ||
            "Failed to create project. Please try again."
        );
      }
    } catch (err) {
      console.error("Failed to create project:", err);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  async function handleSubmitWithCodebook() {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setError(
          (errData as { message?: string }).message ||
            "Failed to create project. Please try again."
        );
        return;
      }

      const project = await res.json();

      // Write codebook.json for the new project
      const codebook = {
        tags: csvRows.map((r) => ({
          id: r.id,
          label: r.label,
          category: r.category,
          color: r.color,
        })),
        categories: [...new Set(csvRows.map((r) => r.category))],
      };

      const codebookRes = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: project.id,
          file: "codebook.json",
          content: JSON.stringify(codebook, null, 2),
        }),
      });
      if (!codebookRes.ok) {
        console.error("Failed to save codebook:", await codebookRes.text());
      }

      // Reset form
      setFormData({
        title: "",
        researcher: "",
        persona: "",
        product: "",
        researchPlan: "",
        codebook: null,
      });
      handleClose();
      router.push(`/builder/${project.id}/findings`);
    } catch (err) {
      console.error("Failed to create project:", err);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const hasMissingCategory = csvRows.some((r) => !r.category);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div
            className="bg-white rounded-md shadow-dialog w-full max-w-lg overflow-hidden border border-stone-200 animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-stone-200 bg-stone-100/50 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-clay-600/10 rounded text-clay-600">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <h2 className="font-serif font-semibold text-stone-900">Create New Project</h2>
              </div>
              <button
                onClick={handleClose}
                className="text-stone-400 hover:text-stone-900 p-1 rounded-md hover:bg-stone-100 transition-colors duration-200 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={
                step === "details" && formData.codebook !== "custom"
                  ? handleSubmit
                  : (e) => e.preventDefault()
              }
              className="flex flex-col max-h-[70vh] overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto p-4 space-y-4">

                {step === "details" && (
                  <>
                    <div className="space-y-1.5">
                      <label htmlFor="project-title" className="text-[10.5px] font-semibold text-stone-500 uppercase tracking-wide">
                        Project Title *
                      </label>
                      <input
                        id="project-title"
                        required
                        className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:border-primary transition-[border-color,box-shadow] text-slate-900 placeholder:text-stone-400"
                        placeholder="e.g. Checkout Flow Usability"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label htmlFor="project-researcher" className="text-[10.5px] font-semibold text-stone-500 uppercase tracking-wide">
                          Researcher *
                        </label>
                        <input
                          id="project-researcher"
                          required
                          className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:border-primary transition-[border-color,box-shadow] text-slate-900 placeholder:text-stone-400"
                          placeholder="Your Name"
                          value={formData.researcher}
                          onChange={(e) =>
                            setFormData({ ...formData, researcher: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="project-persona" className="text-[10.5px] font-semibold text-stone-500 uppercase tracking-wide">
                          Persona *
                        </label>
                        <input
                          id="project-persona"
                          required
                          className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:border-primary transition-[border-color,box-shadow] text-slate-900 placeholder:text-stone-400"
                          placeholder="e.g. New User"
                          value={formData.persona}
                          onChange={(e) =>
                            setFormData({ ...formData, persona: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="project-product" className="text-[10.5px] font-semibold text-stone-500 uppercase tracking-wide">
                        Product (optional)
                      </label>
                      <input
                        id="project-product"
                        className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:border-primary transition-[border-color,box-shadow] text-slate-900 placeholder:text-stone-400"
                        placeholder="e.g. Mobile App"
                        value={formData.product}
                        onChange={(e) =>
                          setFormData({ ...formData, product: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="project-research-plan" className="text-[10.5px] font-semibold text-stone-500 uppercase tracking-wide">
                        Research Plan (optional)
                      </label>
                      <textarea
                        id="project-research-plan"
                        rows={3}
                        className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:border-primary transition-[border-color,box-shadow] text-slate-900 placeholder:text-stone-400 resize-none"
                        placeholder="Study goals and questions..."
                        value={formData.researchPlan}
                        onChange={(e) =>
                          setFormData({ ...formData, researchPlan: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="project-codebook" className="text-[10.5px] font-semibold text-stone-500 uppercase tracking-wide">
                        Codebook
                      </label>
                      <div className="relative">
                        <select
                          id="project-codebook"
                          className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:border-primary transition-[border-color,box-shadow] text-slate-900 appearance-none cursor-pointer"
                          value={formData.codebook || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              codebook: e.target.value || null,
                            })
                          }
                        >
                          <option value="">Global Only</option>
                          <option value="custom">Custom (upload CSV)</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                          <svg
                            className="w-4 h-4 fill-current"
                            viewBox="0 0 20 20"
                          >
                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {step === "codebook" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-slate-700 mb-1">Upload codebook CSV</label>
                      <p className="text-xs text-stone-400 mb-2">
                        Required columns: <code>label</code>, <code>category</code>
                      </p>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const text = await file.text();
                          try {
                            const parsed = parseCsvCodebook(text);
                            const existingIds: string[] = [];
                            const colors: string[] = [];
                            const rows = parsed.map((row) => {
                              const id = generateTagId(row.label, existingIds);
                              existingIds.push(id);
                              const color = assignTagColor(colors);
                              colors.push(color);
                              return { label: row.label, category: row.category, id, color };
                            });
                            setCsvRows(rows);
                            const unique = [...new Set(rows.map((r) => r.category).filter(Boolean))];
                            setNewCategories(unique);
                          } catch (err) {
                            setError(`CSV parse error: ${err instanceof Error ? err.message : String(err)}`);
                          }
                        }}
                        className="block w-full text-sm text-stone-500 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200"
                      />
                    </div>

                    {csvRows.length > 0 && (
                      <>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-stone-500 text-left border-b border-stone-200">
                                <th className="pb-2 pr-4">Label</th>
                                <th className="pb-2 pr-4">Category</th>
                                <th className="pb-2 pr-4">ID</th>
                                <th className="pb-2 pr-4">Color</th>
                                <th className="pb-2">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {csvRows.map((row, i) => (
                                <tr key={i} className="border-b border-stone-200">
                                  <td className="py-2 pr-4 text-slate-900">{row.label}</td>
                                  <td className="py-2 pr-4">
                                    <CategoryCombobox
                                      value={row.category}
                                      existingCategories={newCategories}
                                      onChange={(val) => {
                                        const updated = [...csvRows];
                                        updated[i] = { ...updated[i], category: val };
                                        setCsvRows(updated);
                                        if (val && !newCategories.includes(val)) {
                                          setNewCategories([...newCategories, val]);
                                        }
                                      }}
                                    />
                                  </td>
                                  <td className="py-2 pr-4 text-stone-400 font-mono text-xs">{row.id}</td>
                                  <td className="py-2 pr-4">
                                    <span
                                      className="inline-block w-4 h-4 rounded-full border border-stone-200"
                                      style={{ backgroundColor: row.color }}
                                    />
                                  </td>
                                  <td className="py-2">
                                    {row.category ? (
                                      <span className="text-green-400 text-xs">✓ Ready</span>
                                    ) : (
                                      <span className="text-yellow-400 text-xs">⚠ Missing category</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {newCategories.length > 0 && (
                          <p className="text-xs text-stone-500">
                            New categories:{" "}
                            {newCategories.map((c, i) => (
                              <span key={i} className="inline-flex items-center gap-1 mr-2">
                                <span className="text-slate-700">{c}</span>
                                <span className="text-xs bg-stone-100 px-1 rounded text-stone-500">New</span>
                              </span>
                            ))}
                          </p>
                        )}

                        <p className="text-xs text-stone-400 mt-2">
                          You can update your codebook anytime from the Codebook link in the header.
                        </p>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => setStep("details")}
                      className="text-sm text-stone-500 hover:text-stone-900 transition-colors"
                    >
                      ← Back
                    </button>
                  </div>
                )}

              </div>
              {error && (
                <div role="alert" className="mx-4 mb-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                  {error}
                </div>
              )}
              <div className="px-4 py-2.5 border-t border-stone-200 flex items-center justify-end gap-3 bg-stone-100/50 shrink-0">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
                >
                  Cancel
                </button>

                {step === "details" && formData.codebook === "custom" ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (!formData.title?.trim()) {
                        setError("Project name is required");
                        return;
                      }
                      if (!formData.researcher?.trim()) {
                        setError("Researcher name is required");
                        return;
                      }
                      if (!formData.persona?.trim()) {
                        setError("Persona is required");
                        return;
                      }
                      setError(null);
                      setStep("codebook");
                    }}
                    className="px-4 py-2 text-sm font-medium bg-clay-600 text-white rounded hover:opacity-90 flex items-center gap-2 transition-colors"
                  >
                    Next: Set Up Codebook
                  </button>
                ) : step === "details" ? (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium bg-clay-600 text-white rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Project"
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmitWithCodebook}
                    disabled={isLoading || hasMissingCategory}
                    className="px-4 py-2 text-sm font-medium bg-clay-600 text-white rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Project"
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
