"use client";

import React, { forwardRef, useImperativeHandle, useRef, useEffect } from "react";
import { ChevronDown, Film, Plus } from "lucide-react";
import type { Session } from "@/types";

interface VideoPlayerProps {
  sessions: Session[];
  activeSessionIndex: number;
  onSessionChange: (index: number) => void;
  onTimeUpdate?: (seconds: number) => void;
  onAddSession?: () => void;
  slug: string;
}

export interface VideoPlayerRef {
  seekTo: (seconds: number) => void;
  seekAndPlay: (seconds: number) => void;
  playRange: (start: number, end: number) => void;
}

const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(
  ({ sessions, activeSessionIndex, onSessionChange, onTimeUpdate, onAddSession, slug }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const rangeEndRef = useRef<number | null>(null);

    const activeSession = sessions[activeSessionIndex];

    const handleTimeUpdate = () => {
      const video = videoRef.current;
      if (!video) return;

      if (onTimeUpdate) {
        onTimeUpdate(video.currentTime);
      }

      if (rangeEndRef.current !== null && video.currentTime >= rangeEndRef.current) {
        video.pause();
        rangeEndRef.current = null;
      }
    };

    useImperativeHandle(ref, () => ({
      seekTo: (seconds: number) => {
        if (videoRef.current) {
          videoRef.current.currentTime = seconds;
        }
      },
      seekAndPlay: (seconds: number) => {
        const video = videoRef.current;
        if (!video) return;
        let played = false;
        const doPlay = () => {
          if (played) return;
          played = true;
          video.removeEventListener("seeked", onSeeked);
          clearTimeout(fallback);
          video.play().catch((err) => {
            console.error("Failed to play video:", err);
          });
        };
        const onSeeked = () => {
          if (Math.abs(video.currentTime - seconds) < 1) {
            doPlay();
          }
        };
        video.addEventListener("seeked", onSeeked);
        video.currentTime = seconds;
        const fallback = setTimeout(() => {
          if (played) return;
          played = true;
          video.removeEventListener("seeked", onSeeked);
          video.play().catch((err) => {
            console.error("Failed to play video:", err);
          });
        }, 500);
      },
      playRange: (start: number, end: number) => {
        if (videoRef.current) {
          rangeEndRef.current = end;
          videoRef.current.currentTime = start;
          videoRef.current.play().catch((err) => {
            console.error("Failed to play video:", err);
          });
        }
      },
    }));

    // Videos are served by GET /api/projects/[slug]/files/[...path]
    const videoUrl = activeSession
      ? `/api/projects/${slug}/files/videos/${activeSession.videoFile}`
      : "";

    return (
      <div className="flex flex-col w-full h-full min-h-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Session Selector */}
        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Session
            </span>
            <div className="relative">
              <select
                value={activeSessionIndex}
                onChange={(e) => onSessionChange(Number(e.target.value))}
                className="pl-3 pr-8 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer"
              >
                {sessions.map((session, index) => (
                  <option key={session.id} value={index}>
                    {session.participant}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            {onAddSession && (
              <button
                type="button"
                onClick={onAddSession}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-primary hover:text-primary-dark hover:bg-primary/10 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add session
              </button>
            )}
          </div>
          
          {activeSession && (
            <div className="text-xs text-slate-400 font-medium truncate max-w-[200px]">
              {activeSession.videoFile}
            </div>
          )}
        </div>

        {/* Video Player Area - flex-1 min-h-0 so it shrinks when panel is resized */}
        <div className="flex-1 min-h-0 relative bg-slate-900 flex items-center justify-center overflow-hidden">
          {activeSession ? (
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-contain"
              controls
              preload="auto"
              playsInline
              onTimeUpdate={handleTimeUpdate}
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-500">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                <Film className="w-6 h-6 text-slate-600" />
              </div>
              <span className="text-sm font-medium">No video session selected</span>
            </div>
          )}
        </div>
      </div>
    );
  }
);

VideoPlayer.displayName = "VideoPlayer";

export default VideoPlayer;
