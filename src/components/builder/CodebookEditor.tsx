"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, Edit2, Check, X, Tag as TagIcon, Layers, Info } from "lucide-react";
import { Codebook, CodebookTag } from "@/types";
import { mergeCodebooks } from "@/lib/codebook";

interface CodebookEditorProps {
  slug: string;
  projectCodebook: Codebook | null;
  onSave: (codebook: Codebook) => void;
}

export const CodebookEditor: React.FC<CodebookEditorProps> = ({
  slug,
  projectCodebook,
  onSave,
}) => {
  const [globalCodebook, setGlobalCodebook] = useState<Codebook | null>(null);
  const [customTags, setCustomTags] = useState<CodebookTag[]>(projectCodebook?.tags || []);
  const [customCategories, setCustomCategories] = useState<string[]>(projectCodebook?.categories || []);
  
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [tagForm, setTagForm] = useState<Partial<CodebookTag>>({
    id: "",
    label: "",
    color: "#3B82F6",
    category: "",
  });

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGlobal() {
      try {
        const res = await fetch("/api/codebook/global");
        if (res.ok) {
          const data = await res.json();
          setGlobalCodebook(data);
        }
      } catch (error) {
        console.error("Failed to fetch global codebook:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchGlobal();
  }, []);

  const mergedCodebook = useMemo(() => {
    if (!globalCodebook) return { tags: customTags, categories: customCategories };
    return mergeCodebooks(globalCodebook, { tags: customTags, categories: customCategories });
  }, [globalCodebook, customTags, customCategories]);

  const allCategories = useMemo(() => {
    const cats = new Set([...(globalCodebook?.categories || []), ...customCategories]);
    return Array.from(cats);
  }, [globalCodebook, customCategories]);

  const handleSaveTag = () => {
    if (!tagForm.id || !tagForm.label || !tagForm.category) return;

    const newTag = tagForm as CodebookTag;
    
    if (editingTagId) {
      setCustomTags(customTags.map(t => t.id === editingTagId ? newTag : t));
    } else {
      if (customTags.some(t => t.id === newTag.id) || globalCodebook?.tags.some(t => t.id === newTag.id)) {
        alert("Tag ID already exists");
        return;
      }
      setCustomTags([...customTags, newTag]);
    }

    setEditingTagId(null);
    setIsAddingTag(false);
    setTagForm({ id: "", label: "", color: "#3B82F6", category: "" });
  };

  const handleDeleteTag = (id: string) => {
    setCustomTags(customTags.filter(t => t.id !== id));
  };

  const handleEditTag = (tag: CodebookTag) => {
    setTagForm(tag);
    setEditingTagId(tag.id);
    setIsAddingTag(true);
  };

  const handleAddCategory = () => {
    if (!newCategory || allCategories.includes(newCategory)) return;
    setCustomCategories([...customCategories, newCategory]);
    setNewCategory("");
    setIsAddingCategory(false);
  };

  const handleDeleteCategory = (cat: string) => {
    if (globalCodebook?.categories.includes(cat)) {
      alert("Cannot delete global category");
      return;
    }
    if (customTags.some(t => t.category === cat)) {
      alert("Cannot delete category with tags");
      return;
    }
    setCustomCategories(customCategories.filter(c => c !== cat));
  };

  const handlePersistenceSave = () => {
    onSave({ tags: customTags, categories: customCategories });
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading codebooks...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Codebook Editor</h1>
          <p className="text-slate-500 text-sm mt-1">
            Define the tags and categories for your thematic analysis.
          </p>
        </div>
        <button
          onClick={handlePersistenceSave}
          className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 flex items-center gap-2"
        >
          <Check className="w-4 h-4" />
          Save Codebook
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Categories Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
                <Layers className="w-4 h-4 text-slate-400" />
                Categories
              </h3>
              <button 
                onClick={() => setIsAddingCategory(true)}
                className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 space-y-1">
              {allCategories.map(cat => (
                <div key={cat} className="group flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                  <span>{cat}</span>
                  {!globalCodebook?.categories.includes(cat) && (
                    <button 
                      onClick={() => handleDeleteCategory(cat)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
              {isAddingCategory && (
                <div className="p-2 space-y-2">
                  <input
                    autoFocus
                    type="text"
                    className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    placeholder="Category name..."
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={handleAddCategory}
                      className="flex-1 py-1 text-xs font-bold bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Add
                    </button>
                    <button 
                      onClick={() => setIsAddingCategory(false)}
                      className="flex-1 py-1 text-xs font-bold bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
            <Info className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="text-xs text-amber-700 leading-relaxed">
              Global tags are read-only and available across all projects. Custom tags are specific to this project.
            </p>
          </div>
        </div>

        {/* Tags Main View */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <TagIcon className="w-4 h-4 text-slate-400" />
              Tags
            </h3>
            <button
              onClick={() => {
                setIsAddingTag(true);
                setEditingTagId(null);
                setTagForm({ id: "", label: "", color: "#3B82F6", category: allCategories[0] || "" });
              }}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Custom Tag
            </button>
          </div>

          <div className="space-y-8">
            {allCategories.map(cat => {
              const categoryTags = mergedCodebook.tags.filter(t => t.category === cat);
              if (categoryTags.length === 0) return null;

              return (
                <div key={cat} className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">{cat}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {categoryTags.map(tag => {
                      const isGlobal = globalCodebook?.tags.some(t => t.id === tag.id);
                      return (
                        <div 
                          key={tag.id}
                          className={`group p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-between ${isGlobal ? 'bg-slate-50/50 opacity-80' : ''}`}
                        >
                          <div className="flex items-center gap-4">
                            <div 
                              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm"
                              style={{ backgroundColor: tag.color }}
                            >
                              {tag.label.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900">{tag.label}</span>
                                {isGlobal && (
                                  <span className="px-1.5 py-0.5 bg-slate-200 text-slate-500 rounded text-[9px] font-bold uppercase tracking-tighter">Global</span>
                                )}
                              </div>
                              <span className="text-xs text-slate-400 font-mono">#{tag.id}</span>
                            </div>
                          </div>
                          
                          {!isGlobal && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleEditTag(tag)}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteTag(tag.id)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add/Edit Tag Modal Overlay */}
      {isAddingTag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                {editingTagId ? "Edit Tag" : "Add New Tag"}
              </h2>
              <button onClick={() => setIsAddingTag(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="tag-id" className="text-xs font-bold text-slate-500 uppercase">Tag ID (internal)</label>
                <input
                  id="tag-id"
                  disabled={!!editingTagId}
                  type="text"
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400"
                  placeholder="e.g. pain-point-ui"
                  value={tagForm.id}
                  onChange={e => setTagForm({ ...tagForm, id: e.target.value })}
                />
              </div>
              
              <div className="space-y-1.5">
                <label htmlFor="tag-label" className="text-xs font-bold text-slate-500 uppercase">Label (Display Name)</label>
                <input
                  id="tag-label"
                  type="text"
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="e.g. UI Friction"
                  value={tagForm.label}
                  onChange={e => setTagForm({ ...tagForm, label: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="tag-category" className="text-xs font-bold text-slate-500 uppercase">Category</label>
                  <select
                    id="tag-category"
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    value={tagForm.category}
                    onChange={e => setTagForm({ ...tagForm, category: e.target.value })}
                  >
                    <option value="" disabled>Select category</option>
                    {allCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      className="w-10 h-10 p-1 bg-white border border-slate-200 rounded-lg cursor-pointer"
                      value={tagForm.color}
                      onChange={e => setTagForm({ ...tagForm, color: e.target.value })}
                    />
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg font-mono"
                      value={tagForm.color}
                      onChange={e => setTagForm({ ...tagForm, color: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => setIsAddingTag(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTag}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all"
                >
                  {editingTagId ? "Update Tag" : "Create Tag"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
