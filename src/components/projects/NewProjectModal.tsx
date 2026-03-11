"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2, FolderPlus } from "lucide-react";

export function NewProjectModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: "",
    researcher: "",
    persona: "",
    product: "",
    researchPlan: "",
    codebook: null as string | null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const project = await res.json();
        setIsOpen(false);
        // Reset form
        setFormData({
          title: "",
          researcher: "",
          persona: "",
          product: "",
          researchPlan: "",
          codebook: null,
        });
        router.push(`/builder/${project.id}/findings`);
      }
    } catch (err) {
      console.error("Failed to create project:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="group flex flex-col items-center justify-center p-4 h-full min-h-[200px] bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 cursor-pointer"
      >
        <div className="w-10 h-10 rounded-full bg-slate-200 group-hover:bg-primary/20 flex items-center justify-center mb-3 transition-colors">
          <Plus className="w-5 h-5 text-slate-500 group-hover:text-primary" />
        </div>
          <span className="text-sm text-slate-600 group-hover:text-primary-dark font-medium">
          New Project
        </span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">Create New Project</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors duration-200 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col max-h-[70vh] overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="project-title" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Project Title *
                </label>
                <input
                  id="project-title"
                  required
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 placeholder:text-slate-400"
                  placeholder="e.g. Checkout Flow Usability"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="project-researcher" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Researcher *
                  </label>
                  <input
                    id="project-researcher"
                    required
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 placeholder:text-slate-400"
                    placeholder="Your Name"
                    value={formData.researcher}
                    onChange={(e) =>
                      setFormData({ ...formData, researcher: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="project-persona" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Persona *
                  </label>
                  <input
                    id="project-persona"
                    required
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 placeholder:text-slate-400"
                    placeholder="e.g. New User"
                    value={formData.persona}
                    onChange={(e) =>
                      setFormData({ ...formData, persona: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="project-product" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Product (optional)
                </label>
                <input
                  id="project-product"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 placeholder:text-slate-400"
                  placeholder="e.g. Mobile App"
                  value={formData.product}
                  onChange={(e) =>
                    setFormData({ ...formData, product: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="project-research-plan" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Research Plan (optional)
                </label>
                <textarea
                  id="project-research-plan"
                  rows={3}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 placeholder:text-slate-400 resize-none"
                  placeholder="Study goals and questions..."
                  value={formData.researchPlan}
                  onChange={(e) =>
                    setFormData({ ...formData, researchPlan: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="project-codebook" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Codebook
                </label>
                <div className="relative">
                  <select
                    id="project-codebook"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 appearance-none cursor-pointer"
                    value={formData.codebook || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        codebook: e.target.value || null,
                      })
                    }
                  >
                    <option value="">Global Only</option>
                    <option value="custom" disabled>
                      Upload Custom (JSON) — Coming Soon
                    </option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg
                      className="w-4 h-4 fill-current"
                      viewBox="0 0 20 20"
                    >
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
              </div>

              </div>
              <div className="px-4 py-2.5 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-bold bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
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
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
