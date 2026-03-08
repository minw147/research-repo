"use client";

import React, { forwardRef, useImperativeHandle, useRef, useEffect } from "react";
import { ChevronDown, Film } from "lucide-react";
import type { Session } from "@/types";

interface VideoPlayerProps {
  sessions: Session[];
  activeSessionIndex: number;
  onSessionChange: (index: number) => void;
  onTimeUpdate?: (seconds: number) => void;
  slug: string;
}

export interface VideoPlayerRef {
  seekTo: (seconds: number) => void;
  playRange: (start: number, end: number) => void;
}

const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(
  ({ sessions, activeSessionIndex, onSessionChange, onTimeUpdate, slug }, ref) => {
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

    // Construct video URL. 
    // Assuming videos are served via an API that maps to content/projects/[slug]/videos/[file]
    // If not yet implemented, this URL pattern is a reasonable placeholder/standard.
    const videoUrl = activeSession
      ? `/api/projects/${slug}/videos/${activeSession.videoFile}`
      : "";

    return (
      <div className="flex flex-col w-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Session Selector */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Session
            </span>
            <div className="relative">
              <select
                value={activeSessionIndex}
                onChange={(e) => onSessionChange(Number(e.target.value))}
                className="pl-3 pr-8 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
              >
                {sessions.map((session, index) => (
                  <option key={session.id} value={index}>
                    {session.participant}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
          
          {activeSession && (
            <div className="text-xs text-slate-400 font-medium truncate max-w-[200px]">
              {activeSession.videoFile}
            </div>
          )}
        </div>

        {/* Video Player Area */}
        <div className="relative aspect-video bg-slate-900 flex items-center justify-center">
          {activeSession ? (
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full"
              controls
              preload="metadata"
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
