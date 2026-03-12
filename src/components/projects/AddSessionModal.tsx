"use client";

import React, { useState, useRef } from "react";
import { X, Upload, Loader2 } from "lucide-react";
import type { Project } from "@/types";

interface AddSessionModalProps {
  project: Project;
  onSuccess: (updatedProject: Project) => void;
  onClose: () => void;
}

export function AddSessionModal({ project, onSuccess, onClose }: AddSessionModalProps) {
  const [participant, setParticipant] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const transcriptInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile || !transcriptFile) {
      setError("Please select both a video and a transcript file.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const form = new FormData();
      form.append("participant", participant.trim() || "Participant");
      form.append("video", videoFile);
      form.append("transcript", transcriptFile);

      const res = await fetch(`/api/projects/${project.id}/sessions`, {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to add session");
      }

      const updatedProject = await res.json();
      onSuccess(updatedProject);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-semibold text-slate-900">Add Session</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Participant name
            </label>
            <input
              type="text"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 placeholder:text-slate-400"
              placeholder="e.g. User 1, Alex"
              value={participant}
              onChange={(e) => setParticipant(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Video file *
            </label>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              className="w-full flex items-center gap-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors text-slate-600 text-sm"
            >
              <Upload className="w-4 h-4" />
              {videoFile ? videoFile.name : "Choose video (e.g. .mp4)"}
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Transcript file *
            </label>
            <input
              ref={transcriptInputRef}
              type="file"
              accept=".txt,.vtt"
              className="hidden"
              onChange={(e) => setTranscriptFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => transcriptInputRef.current?.click()}
              className="w-full flex items-center gap-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors text-slate-600 text-sm"
            >
              <Upload className="w-4 h-4" />
              {transcriptFile ? transcriptFile.name : "Choose transcript (.txt or .vtt)"}
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !videoFile || !transcriptFile}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:pointer-events-none transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding…
                </>
              ) : (
                "Add Session"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
