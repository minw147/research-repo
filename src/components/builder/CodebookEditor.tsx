"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Check, X, Tag as TagIcon, Layers, Info } from "lucide-react";
import { Codebook, CodebookTag } from "@/types";

interface CodebookEditorProps {
  projectCodebook: Codebook | null;
  onSave: (codebook: Codebook) => void;
  showProjectTab?: boolean;       // default true; false when no project context
  globalCodebook?: Codebook;      // passed in for the Global tab
  onSaveGlobal?: (codebook: Codebook) => Promise<void>;
  onCascade?: (
    action: "rename" | "delete",
    oldId: string,
    newId?: string
  ) => Promise<{ affectedFiles: string[]; affectedQuoteCount: number }>;
}

export const CodebookEditor: React.FC<CodebookEditorProps> = (props) => {
  const {
    projectCodebook,
    onSave,
    showProjectTab,
    globalCodebook: globalCodebookProp,
    onSaveGlobal,
  } = props;
  const [customTags, setCustomTags] = useState<CodebookTag[]>(projectCodebook?.tags || []);
  const [customCategories, setCustomCategories] = useState<string[]>(projectCodebook?.categories || []);

  const [isAddingTag, setIsAddingTag] = useState(false);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [tagForm, setTagForm] = useState<Partial<CodebookTag>>({
    id: "",
    label: "",
    color: "#f59f0a",
    category: "",
  });

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryValue, setEditCategoryValue] = useState("");

  const [pendingCascade, setPendingCascade] = useState<{
    action: "rename" | "delete";
    oldId: string;
    newId?: string;
    affectedFiles: string[];
    affectedQuoteCount: number;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<"project" | "global">(
    showProjectTab !== false ? "project" : "global"
  );

  useEffect(() => {
    if (activeTab === "global" && globalCodebookProp) {
      setCustomTags(globalCodebookProp.tags);
      setCustomCategories(globalCodebookProp.categories);
    } else if (activeTab === "project") {
      setCustomTags(projectCodebook?.tags ?? []);
      setCustomCategories(projectCodebook?.categories ?? []);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);


  const handleSaveTag = async () => {
    if (!tagForm.id || !tagForm.label || !tagForm.category) return;

    const newTag = tagForm as CodebookTag;

    if (editingTagId) {
      const oldTag = customTags.find(t => t.id === editingTagId);
      if (oldTag) {
        await handleUpdateTagWithCascade(oldTag, newTag);
      } else {
        setCustomTags(customTags.map(t => t.id === editingTagId ? newTag : t));
      }
    } else {
      if (customTags.some(t => t.id === newTag.id)) {
        alert("Tag ID already exists");
        return;
      }
      setCustomTags([...customTags, newTag]);
    }

    setEditingTagId(null);
    setIsAddingTag(false);
    setTagForm({ id: "", label: "", color: "#f59f0a", category: "" });
  };

  const handleDeleteTag = async (id: string) => {
    await handleDeleteTagWithCascade(id);
  };

  async function handleDeleteTagWithCascade(tagId: string) {
    if (activeTab !== "global" || !props.onCascade) {
      setCustomTags((prev) => prev.filter((t) => t.id !== tagId));
      return;
    }
    const result = await props.onCascade("delete", tagId);
    setPendingCascade({ action: "delete", oldId: tagId, ...result });
  }

  async function handleUpdateTagWithCascade(oldTag: CodebookTag, newTag: CodebookTag) {
    if (activeTab !== "global" || !props.onCascade || oldTag.id === newTag.id) {
      setCustomTags((prev) => prev.map((t) => (t.id === oldTag.id ? newTag : t)));
      return;
    }
    const result = await props.onCascade("rename", oldTag.id, newTag.id);
    setPendingCascade({ action: "rename", oldId: oldTag.id, newId: newTag.id, ...result });
  }

  const handleEditTag = (tag: CodebookTag) => {
    setTagForm(tag);
    setEditingTagId(tag.id);
    setIsAddingTag(true);
  };

  const handleAddCategory = () => {
    if (!newCategory || customCategories.includes(newCategory)) return;
    setCustomCategories([...customCategories, newCategory]);
    setNewCategory("");
    setIsAddingCategory(false);
  };

  const handleStartCategoryEdit = (cat: string) => {
    setEditingCategory(cat);
    setEditCategoryValue(cat);
  };

  const handleSaveCategoryRename = () => {
    if (!editingCategory || !editCategoryValue || editingCategory === editCategoryValue) {
      setEditingCategory(null);
      return;
    }

    if (customCategories.includes(editCategoryValue)) {
      alert("Category name already exists");
      return;
    }

    // Update category name
    setCustomCategories(customCategories.map(c => c === editingCategory ? editCategoryValue : c));

    // Update all tags with this category
    setCustomTags(customTags.map(tag =>
      tag.category === editingCategory ? { ...tag, category: editCategoryValue } : tag
    ));

    setEditingCategory(null);
    setEditCategoryValue("");
  };

  const handleDeleteCategory = (cat: string) => {
    if (customTags.some(t => t.category === cat)) {
      alert("Cannot delete category with tags");
      return;
    }
    setCustomCategories(customCategories.filter(c => c !== cat));
  };

  const handlePersistenceSave = async () => {
    if (activeTab === "global") {
      await onSaveGlobal?.({ tags: customTags, categories: customCategories });
    } else {
      onSave({ tags: customTags, categories: customCategories });
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-slate-900">Codebook</h2>
          {showProjectTab !== false && (
            <div className="flex rounded-md overflow-hidden border border-slate-200 text-sm">
              {(["project", "global"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 capitalize ${
                    activeTab === tab
                      ? "bg-primary text-white"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={handlePersistenceSave}
          className="px-4 py-2 text-sm font-bold bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
        >
          <Check className="w-4 h-4" />
          Save Codebook
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
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
            <div className="p-1.5 space-y-0.5">
              {customCategories.map(cat => (
                <div key={cat} className="group flex flex-col px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                  {editingCategory === cat ? (
                    <div className="space-y-2 py-1">
                      <input
                        autoFocus
                        type="text"
                        className="w-full px-2 py-1 text-sm border border-slate-200 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        value={editCategoryValue}
                        onChange={e => setEditCategoryValue(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSaveCategoryRename();
                          if (e.key === 'Escape') setEditingCategory(null);
                        }}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveCategoryRename}
                          className="flex-1 py-1 text-[10px] font-bold bg-primary text-white rounded hover:bg-primary-dark"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingCategory(null)}
                          className="flex-1 py-1 text-[10px] font-bold bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <span>{cat}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => handleStartCategoryEdit(cat)}
                          className="p-1 text-slate-400 hover:text-primary transition-colors"
                          aria-label={`Edit ${cat}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat)}
                          className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                          aria-label={`Delete ${cat}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {isAddingCategory && (
                <div className="p-2 space-y-2">
                  <input
                    autoFocus
                    type="text"
                    className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    placeholder="Category name..."
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddCategory}
                      className="flex-1 py-1 text-xs font-bold bg-primary text-white rounded hover:bg-primary-dark"
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

          <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 flex gap-2">
            <Info className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-xs text-amber-700 leading-relaxed">
              {activeTab === "global"
                ? "Editing the global codebook. Changes apply across all projects."
                : "Custom tags are specific to this project. Switch to Global to view or edit tags shared across all projects."}
            </p>
          </div>
        </div>

        {/* Tags Main View */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
              <TagIcon className="w-4 h-4 text-slate-400" />
              Tags
            </h3>
            <button
              onClick={() => {
                setIsAddingTag(true);
                setEditingTagId(null);
                setTagForm({ id: "", label: "", color: "#f59f0a", category: customCategories[0] || "" });
              }}
              className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Custom Tag
            </button>
          </div>

          <div className="space-y-6">
            {customCategories.map(cat => {
              const categoryTags = customTags.filter(t => t.category === cat);
              if (categoryTags.length === 0) return null;

              return (
                <div key={cat} className="space-y-2">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">{cat}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {categoryTags.map(tag => (
                      <div
                        key={tag.id}
                        className="group p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm"
                            style={{ backgroundColor: tag.color }}
                          >
                            {tag.label.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900">{tag.label}</span>
                            <div className="text-xs text-slate-400 font-mono">#{tag.id}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditTag(tag)}
                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
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
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {customTags.length === 0 && (
              <div className="py-10 text-center text-slate-400 text-sm">
                {activeTab === "project"
                  ? "No project tags yet — click \"Add Custom Tag\" to create one."
                  : "No global tags yet — click \"Add Custom Tag\" to create one."}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cascade Confirmation Modal */}
      {pendingCascade && (
        <div className="fixed inset-0 bg-black/70 z-[70] flex items-center justify-center p-4">
          <div className="bg-gray-800 border border-white/10 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-white font-semibold mb-2 text-base">
              {pendingCascade.action === "rename" ? "Rename global tag" : "Delete global tag"}
            </h3>
            <p className="text-white/70 text-sm mb-4">
              This will update{" "}
              <span className="text-white font-medium">
                {pendingCascade.affectedQuoteCount} quote
                {pendingCascade.affectedQuoteCount !== 1 ? "s" : ""}
              </span>{" "}
              across{" "}
              <span className="text-white font-medium">
                {pendingCascade.affectedFiles.length} file
                {pendingCascade.affectedFiles.length !== 1 ? "s" : ""}
              </span>
              . Published reports will need to be re-exported to reflect this change.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setPendingCascade(null)}
                className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  // Execute the cascade (non-dry-run)
                  await props.onCascade?.(
                    pendingCascade.action,
                    pendingCascade.oldId,
                    pendingCascade.newId
                  );

                  // Compute final tags once — use for both state and save
                  const finalTags =
                    pendingCascade.action === "delete"
                      ? customTags.filter((t) => t.id !== pendingCascade.oldId)
                      : customTags.map((t) =>
                          t.id === pendingCascade.oldId && pendingCascade.newId
                            ? { ...t, id: pendingCascade.newId! }
                            : t
                        );

                  setCustomTags(finalTags);
                  await props.onSaveGlobal?.({ tags: finalTags, categories: customCategories });
                  setPendingCascade(null);
                }}
                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Tag Modal Overlay */}
      {isAddingTag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in duration-200">
            <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingTagId ? "Edit Tag" : "Add New Tag"}
              </h2>
              <button
                onClick={() => setIsAddingTag(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors duration-200 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="space-y-1.5">
                <label htmlFor="tag-id" className="text-xs font-bold text-slate-500 uppercase">Tag ID (internal)</label>
                <input
                  id="tag-id"
                  disabled={!!editingTagId}
                  type="text"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400"
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
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
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
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    value={tagForm.category}
                    onChange={e => setTagForm({ ...tagForm, category: e.target.value })}
                  >
                    <option value="" disabled>Select category</option>
                    {customCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      className="w-9 h-9 p-0.5 bg-white border border-slate-200 rounded-lg cursor-pointer"
                      value={tagForm.color}
                      onChange={e => setTagForm({ ...tagForm, color: e.target.value })}
                    />
                    <input
                      type="text"
                      className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono"
                      value={tagForm.color}
                      onChange={e => setTagForm({ ...tagForm, color: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  onClick={() => setIsAddingTag(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTag}
                  className="flex-1 px-4 py-2 text-sm font-bold bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
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
