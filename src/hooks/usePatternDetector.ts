"use client";
import { useCallback, useRef } from "react";

export interface PatternDef {
  keyword: string;
  label: string;
  triggers: string[];
}

export const BUILT_IN_PATTERNS: PatternDef[] = [
  {
    keyword: "cross-reference sessions",
    label: "cross-reference sessions",
    triggers: ["previous session", "cross-reference", "compare sessions"],
  },
  {
    keyword: "extract themes",
    label: "extract themes",
    triggers: ["themes", "tags", "patterns across"],
  },
  {
    keyword: "participant quote lookup",
    label: "look up participant quotes",
    triggers: ["what did", "mentioned", "said something about"],
  },
  {
    keyword: "affinity clustering",
    label: "group and cluster",
    triggers: ["group", "cluster", "affinity"],
  },
];

export interface PatternNudgeState {
  keyword: string;
  label: string;
}

const NUDGE_STORAGE_KEY = "ra-pattern-nudge-state";
const NUDGE_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours
const FIRE_THRESHOLD = 3;

interface NudgeRecord {
  count: number;
  lastFiredAt: number | null;
  sessionId: string;
}

type NudgeStore = Record<string, NudgeRecord>;

function loadNudgeStore(): NudgeStore {
  try {
    const raw = localStorage.getItem(NUDGE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveNudgeStore(store: NudgeStore): void {
  localStorage.setItem(NUDGE_STORAGE_KEY, JSON.stringify(store));
}

export function matchPattern(
  text: string,
  suppressed: string[]
): PatternDef | null {
  const lower = text.toLowerCase();
  for (const pattern of BUILT_IN_PATTERNS) {
    if (suppressed.includes(pattern.keyword)) continue;
    if (pattern.triggers.some((t) => lower.includes(t.toLowerCase()))) {
      return pattern;
    }
  }
  return null;
}

export function usePatternDetector(opts: {
  sessionId: string;
  suppressed: string[];
  onNudge: (state: PatternNudgeState) => void;
}) {
  const { sessionId, suppressed, onNudge } = opts;
  const storeRef = useRef<NudgeStore | null>(null);

  const getStore = useCallback((): NudgeStore => {
    if (!storeRef.current) {
      storeRef.current = loadNudgeStore();
    }
    return storeRef.current;
  }, []);

  const analyze = useCallback(
    (text: string) => {
      const pattern = matchPattern(text, suppressed);
      if (!pattern) return;

      const store = getStore();
      const key = pattern.keyword;
      const existing = store[key] ?? { count: 0, lastFiredAt: null, sessionId };

      const newCount = existing.count + 1;
      const now = Date.now();

      const shouldFire =
        newCount >= FIRE_THRESHOLD &&
        (existing.lastFiredAt === null ||
          now - existing.lastFiredAt > NUDGE_COOLDOWN_MS);

      store[key] = {
        count: newCount,
        lastFiredAt: shouldFire ? now : existing.lastFiredAt,
        sessionId,
      };

      storeRef.current = store;
      saveNudgeStore(store);

      if (shouldFire) {
        onNudge({ keyword: key, label: pattern.label });
      }
    },
    [suppressed, sessionId, onNudge, getStore]
  );

  const resetCounts = useCallback(() => {
    storeRef.current = {};
    localStorage.removeItem(NUDGE_STORAGE_KEY);
  }, []);

  return { analyze, resetCounts };
}
