import React from "react";
import { TranscriptLine } from "@/types";

interface TranscriptLineProps {
  line: TranscriptLine;
  isActive: boolean;
  onClick: (sec: number) => void;
  /** Duration in seconds for this line (used for clip creation; default 2). */
  durationSec?: number;
}

export const TranscriptLine: React.FC<TranscriptLineProps> = ({
  line,
  isActive,
  onClick,
  durationSec = 2,
}) => {
  const formatTime = (sec: number) => {
    const min = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${min.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div
      role="paragraph"
      data-timestamp={line.sec}
      data-duration={durationSec}
      className={`group flex items-start py-1 px-4 transition-colors ${
        isActive ? "bg-primary/10 border-l-2 border-l-primary" : ""
      }`}
    >
      {/* Column 1: timestamp only — clickable to seek, not selectable */}
      <button
        type="button"
        onClick={() => onClick(line.sec)}
        className="shrink-0 w-14 min-w-[3.5rem] text-left font-mono text-xs text-gray-400 mt-0.5 select-none cursor-pointer hover:text-gray-600 hover:bg-gray-100 rounded py-0.5 -my-0.5 -mx-1"
        aria-label={`Play from ${formatTime(line.sec)}`}
      >
        [{formatTime(line.sec)}]
      </button>
      {/* Column 2: transcript text only — selectable for clips */}
      <p
        className={`flex-1 min-w-0 text-sm select-text cursor-text pl-2 ${
          isActive ? "text-slate-900 font-medium" : "text-gray-700"
        }`}
      >
        {line.text}
      </p>
    </div>
  );
};
