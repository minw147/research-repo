import React from "react";
import { TranscriptLine } from "@/types";

interface TranscriptLineProps {
  line: TranscriptLine;
  isActive: boolean;
  onClick: (sec: number) => void;
}

export const TranscriptLine: React.FC<TranscriptLineProps> = ({
  line,
  isActive,
  onClick,
}) => {
  const formatTime = (sec: number) => {
    const min = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${min.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div
      onClick={() => onClick(line.sec)}
      className={`group flex items-start gap-3 py-1 px-4 cursor-pointer transition-colors hover:bg-gray-100 ${
        isActive ? "bg-blue-50 border-l-2 border-l-blue-400" : ""
      }`}
    >
      <span className="shrink-0 font-mono text-xs text-gray-400 mt-1">
        [{formatTime(line.sec)}]
      </span>
      <p className={`text-sm ${isActive ? "text-blue-900 font-medium" : "text-gray-700"}`}>
        {line.text}
      </p>
    </div>
  );
};
