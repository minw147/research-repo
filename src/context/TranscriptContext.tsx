"use client";

import { createContext, useContext } from "react";
import type { TranscriptLine } from "@/lib/transcript";

interface TranscriptContextValue {
  lines: TranscriptLine[];
  vttUrl: string | null;
}

const TranscriptContext = createContext<TranscriptContextValue>({ lines: [], vttUrl: null });

export function TranscriptProvider({
  children,
  lines,
  vttUrl,
}: {
  children: React.ReactNode;
  lines: TranscriptLine[];
  vttUrl: string | null;
}) {
  return (
    <TranscriptContext.Provider value={{ lines, vttUrl }}>
      {children}
    </TranscriptContext.Provider>
  );
}

export function useTranscript() {
  return useContext(TranscriptContext);
}
