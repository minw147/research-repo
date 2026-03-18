"use client";

import { useRef, useEffect, useMemo } from "react";
import { TranscriptLine, getTranscriptExcerpt, getClipVtt } from "@/lib/transcript";

interface ClipProps {
  src: string;
  label: string;
  start?: number; // seconds, clip start
  end?: number; // seconds, clip end (if absent, uses start + clipDuration)
  clipDuration?: number; // seconds per clip, default 20
  participant?: string;
  duration?: string; // e.g. "04:12" for display
  transcriptLines?: TranscriptLine[];
  vttUrl?: string;
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/** Detect cloud video share URLs (Google Drive, OneDrive, SharePoint) */
function isCloudVideoUrl(src: string): boolean {
  return /drive\.google\.com|1drv\.ms|onedrive\.live\.com|sharepoint\.com/i.test(src);
}

/** OneDrive/SharePoint blocks iframe embeds—show link placeholder instead */
function isOneDriveOrSharePoint(src: string): boolean {
  return /1drv\.ms|onedrive\.live\.com|sharepoint\.com/i.test(src);
}

/** Detect pre-sliced clip file (e.g. /videos/clips/name_01_70s.mp4) - video timeline is 0..duration, not original */
function isSlicedClip(src: string): boolean {
  return /\/clips\/|_\d+_\d+s\.(mp4|webm|mkv)/i.test(src);
}

/** Convert cloud share URL to embeddable iframe URL */
function toCloudEmbedUrl(url: string): string {
  if (/drive\.google\.com/.test(url)) {
    return url.replace(/\/view[^/]*$/, "/preview").replace(/\?.*$/, "");
  }
  if (/1drv\.ms/.test(url)) {
    let u = url.replace(/\/v\//, "/i/").replace(/\/e\//, "/i/");
    if (!/embed=1/.test(u)) u = u + (u.includes("?") ? "&embed=1" : "?embed=1");
    return u;
  }
  if (/onedrive\.live\.com|sharepoint\.com/i.test(url)) {
    return url.includes("embed=1") ? url : url + (url.includes("?") ? "&embed=1" : "?embed=1");
  }
  return url;
}

export default function Clip({
  src,
  label,
  start = 0,
  end,
  clipDuration = 20,
  participant,
  duration,
  transcriptLines = [],
  vttUrl,
}: ClipProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lines = transcriptLines;
  const clipEnd = end ?? start + clipDuration;
  const transcriptExcerpt = lines.length > 0 ? getTranscriptExcerpt(lines, start, clipEnd) : null;

  // For sliced clips, VTT must have timestamps rebased to 0 (clip's own timeline). Full vttUrl uses original video timeline.
  const trackSrc = useMemo(() => {
    if (isSlicedClip(src) && lines.length > 0) {
      const vtt = getClipVtt(lines, start, clipEnd);
      if (vtt) {
        // Use data URL for reliability (no blob revocation issues)
        const base64 = btoa(unescape(encodeURIComponent(vtt)));
        return `data:text/vtt;charset=utf-8;base64,${base64}`;
      }
    }
    return vttUrl;
  }, [src, lines, start, clipEnd, vttUrl]);

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

  // Pre-sliced clips start at 0; full-video URLs need #t=start to seek
  const srcWithStart =
    src.includes("#") ? src
    : isSlicedClip(src) ? src  // sliced file: no #t=, plays from 0
    : `${src}#t=${start}`;
  const watchUrl = isCloudVideoUrl(src) ? src : `${src}#t=${start}`;

  if (isCloudVideoUrl(src)) {
    const isOneDrive = isOneDriveOrSharePoint(src);
    const embedSrc = toCloudEmbedUrl(src);

    return (
      <div className="group my-8 rounded-xl border-l-4 border-primary bg-white shadow-sm ring-1 ring-slate-200 transition-shadow hover:shadow-md">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:gap-6">
          <div className="relative shrink-0">
            {isOneDrive ? (
              <a
                href={watchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-[180px] w-full max-w-md flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 transition-colors hover:border-primary hover:bg-slate-100"
              >
                <svg className="h-12 w-12 text-slate-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span className="text-sm font-medium text-slate-600">
                  Watch clip at {formatTime(start)}–{formatTime(clipEnd)}
                </span>
              </a>
            ) : (
              <iframe
                src={embedSrc}
                title="Video clip"
                className="h-[240px] w-full max-w-md rounded-xl bg-black"
                allow="autoplay"
                allowFullScreen
              />
            )}
            {start > 0 && (
              <div className="absolute -bottom-2 -right-2 rounded-md bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                {formatTime(start)}–{formatTime(clipEnd)}
              </div>
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            {participant && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{participant}</span>
                {duration && <><span className="h-1 w-1 rounded-full bg-slate-300" /><span className="text-xs text-slate-400">{duration}</span></>}
              </div>
            )}
            <blockquote>
              <p className="text-lg font-medium leading-normal text-slate-800">{label}</p>
            </blockquote>
            <a href={watchUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-400 hover:text-primary transition-colors">
              Watch clip at {formatTime(start)}–{formatTime(clipEnd)}
            </a>
            {transcriptExcerpt && (
              <details className="mt-2 rounded-lg border border-slate-200 overflow-hidden">
                <summary className="cursor-pointer select-none px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50">Transcript ({formatTime(start)}–{formatTime(clipEnd)})</summary>
                <div className="border-t border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-600">{transcriptExcerpt}</div>
              </details>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group my-8 rounded-xl border-l-4 border-primary bg-white shadow-sm ring-1 ring-slate-200 transition-shadow hover:shadow-md">
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
            {trackSrc && (
              <track kind="captions" src={trackSrc} srcLang="en" label="English" default />
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
            <p className="text-lg font-medium leading-normal text-slate-800">{label}</p>
          </blockquote>
          <a
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
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
