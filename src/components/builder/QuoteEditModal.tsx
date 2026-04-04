"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Save, Clock, Tag, EyeOff, Eye, FileEdit } from "lucide-react";
import { ParsedQuote, Codebook } from "@/types";

interface QuoteEditModalProps {
  quote: ParsedQuote;
  codebook: Codebook;
  onSave: (updatedQuote: ParsedQuote) => void;
  onClose: () => void;
}

export const QuoteEditModal: React.FC<QuoteEditModalProps> = ({
  quote,
  codebook,
  onSave,
  onClose,
}) => {
  const [tags, setTags] = useState<string[]>(quote.tags);
  const [duration, setDuration] = useState(quote.durationSeconds);
  const [hidden, setHidden] = useState(quote.hidden || false);
  const [tagInput, setTagInput] = useState("");
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(e.target as Node)) {
        setShowTagSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddTag = (tagId: string) => {
    if (tags.length < 3 && !tags.includes(tagId)) {
      setTags([...tags, tagId]);
    }
    setTagInput("");
    setShowTagSuggestions(false);
  };

  const handleRemoveTag = (tagId: string) => {
    setTags(tags.filter((t) => t !== tagId));
  };

  const handleSave = () => {
    onSave({
      ...quote,
      tags,
      durationSeconds: duration,
      hidden,
    });
  };

  const filteredSuggestions = codebook.tags.filter(
    (t) =>
      !tags.includes(t.id) &&
      (t.label.toLowerCase().includes(tagInput.toLowerCase()) ||
        t.id.toLowerCase().includes(tagInput.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
              <FileEdit className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Edit Quote</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors duration-200 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Quote Text Preview */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 max-h-40 overflow-y-auto">
            <p className="text-sm text-slate-600 italic leading-relaxed">
              &ldquo;{quote.text}&rdquo;
            </p>
          </div>

          {/* Tag Editor */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Tag className="w-3.5 h-3.5" />
              Tags (max 3)
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tagId) => {
                const tagInfo = codebook.tags.find((t) => t.id === tagId);
                return (
                  <span
                    key={tagId}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-full text-sm font-medium text-slate-700"
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: tagInfo?.color || "#cbd5e1" }}
                    />
                    {tagInfo?.label || tagId}
                    <button
                      onClick={() => handleRemoveTag(tagId)}
                      className="ml-1 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                );
              })}
            </div>
            
            {tags.length < 3 && (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Add a tag..."
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:border-primary transition-[border-color,box-shadow] text-sm"
                  value={tagInput}
                  onChange={(e) => {
                    setTagInput(e.target.value);
                    setShowTagSuggestions(true);
                  }}
                  onFocus={() => setShowTagSuggestions(true)}
                />
                
                {showTagSuggestions && filteredSuggestions.length > 0 && (
                  <div
                    ref={suggestionRef}
                    className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                  >
                    {filteredSuggestions.map((tag) => (
                      <button
                        key={tag.id}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-3 transition-colors"
                        onClick={() => handleAddTag(tag.id)}
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">{tag.label}</span>
                          <span className="text-[10px] text-slate-500 uppercase">{tag.category}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Duration Editor */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              Duration (seconds)
            </label>
            <input
              type="number"
              min="1"
              max="300"
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:border-primary transition-[border-color,box-shadow] text-sm"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value, 10) || 0)}
            />
          </div>

          {/* Hide from Transcript */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <EyeOff className="w-3.5 h-3.5" />
              Transcript Visibility
            </label>
            <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setHidden(!hidden)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-xs transition-colors ${
                  hidden
                    ? "bg-amber-100 text-amber-700 border border-amber-200"
                    : "bg-white text-slate-700 border border-slate-200 hover:border-slate-300 shadow-sm"
                }`}
              >
                {hidden ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    Hidden
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    Visible
                  </>
                )}
              </button>
              <p className="text-xs text-slate-500 flex-1">
                Hidden quotes stay in your findings document but won&apos;t clutter the transcript viewer on the left.
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 py-2.5 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-bold bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
