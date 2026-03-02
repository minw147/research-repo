"use client";

import { useRef, useEffect } from "react";
import { useTranscript } from "@/context/TranscriptContext";
import { getTranscriptExcerpt } from "@/lib/transcript";

interface ClipProps {
  src: string;
  label: string;
  start?: number; // seconds, clip start
  end?: number; // seconds, clip end (if absent, uses start + clipDuration)
  clipDuration?: number; // seconds per clip, default 20
  participant?: string;
  duration?: string; // e.g. "04:12" for display
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function Clip({
  src,
  label,
  start = 0,
  end,
  clipDuration = 20,
  participant,
  duration,
}: ClipProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { lines, vttUrl } = useTranscript();
  const clipEnd = end ?? start + clipDuration;
  const transcriptExcerpt = lines.length > 0 ? getTranscriptExcerpt(lines, start, clipEnd) : null;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || clipEnd <= start) return;

    const stopAtEnd = () => {
      if (video.currentTime >= clipEnd) {
        video.pause();
        video.currentTime = start;
      }
    };

    video.addEventListener("timeupdate", stopAtEnd);
    return () => video.removeEventListener("timeupdate", stopAtEnd);
  }, [start, clipEnd]);

  const srcWithStart = src.includes("#") ? src : `${src}#t=${start}`;

  return (
    <div className="group my-8 rounded-xl border-l-4 border-primary bg-white shadow-sm ring-1 ring-slate-200 transition-all hover:shadow-md">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:gap-6">
        {/* Video Area */}
        <div className="relative shrink-0">
          <video
            ref={videoRef}
            src={srcWithStart}
            controls
            className="h-auto max-w-md rounded-xl bg-black"
            preload="metadata"
          >
            {vttUrl && (
              <track kind="captions" src={vttUrl} srcLang="en" label="English" default />
            )}
          </video>
          {start > 0 && (
            <div className="absolute -bottom-2 -right-2 rounded-md bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
              {formatTime(start)}–{formatTime(clipEnd)}
            </div>
          )}
        </div>

        {/* Quote & Meta */}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {participant && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {participant}
              </span>
              {duration && (
                <>
                  <span className="h-1 w-1 rounded-full bg-slate-300" />
                  <span className="text-xs text-slate-400">{duration}</span>
                </>
              )}
            </div>
          )}
          <blockquote>
            <p className="text-lg font-medium leading-normal text-slate-800">
              &ldquo;{label}&rdquo;
            </p>
          </blockquote>
          <a
            href={`${src}#t=${start}`}
            className="text-xs text-slate-400 hover:text-primary transition-colors"
          >
            Watch clip at {formatTime(start)}–{formatTime(clipEnd)}
          </a>
          {transcriptExcerpt && (
            <details className="mt-2 rounded-lg border border-slate-200 overflow-hidden">
              <summary className="cursor-pointer select-none px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50">
                Transcript ({formatTime(start)}–{formatTime(clipEnd)})
              </summary>
              <div className="border-t border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-600">
                {transcriptExcerpt}
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
