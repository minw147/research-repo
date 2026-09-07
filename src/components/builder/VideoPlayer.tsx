"use client";

import React, { forwardRef, useImperativeHandle, useRef, useEffect } from "react";
import { Film, Plus } from "lucide-react";
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
      <div className="flex flex-col w-full h-full min-h-0 overflow-hidden">
        {/* Session Selector */}
        <div className="shrink-0 flex flex-col gap-2.5 px-4 py-3 border-b border-stone-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide">
              Session
            </span>
            {activeSession && (
              <div className="text-xs text-stone-500 font-medium truncate max-w-[200px]">
                {activeSession.videoFile}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {sessions.map((session, index) => (
              <button
                key={session.id}
                type="button"
                role="radio"
                aria-checked={index === activeSessionIndex}
                onClick={() => onSessionChange(index)}
                className={`shrink-0 px-2.5 py-1 rounded text-[11.5px] font-semibold transition-colors cursor-pointer ${
                  index === activeSessionIndex
                    ? "bg-primary text-white"
                    : "border border-stone-200 text-stone-600 hover:border-stone-300"
                }`}
              >
                S{index + 1} · {session.participant}
              </button>
            ))}
            {onAddSession && (
              <button
                type="button"
                onClick={onAddSession}
                className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded text-[11.5px] border border-dashed border-stone-300 text-stone-500 hover:text-primary hover:border-primary/40 transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                Add session
              </button>
            )}
          </div>
        </div>

        {/* Video Player Area - flex-1 min-h-0 so it shrinks when panel is resized */}
        <div className="flex-1 min-h-0 relative bg-stone-900 flex items-center justify-center overflow-hidden">
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
            <div className="flex flex-col items-center gap-2 text-stone-400">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                <Film className="w-6 h-6 text-stone-300" />
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
