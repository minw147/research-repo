"use client";
import { useState, useEffect, useCallback } from "react";

export type ProfileLoadState = "loading" | "onboarding" | "ready" | "error";

export interface ResearcherProfile {
  content: string;
}

export function useResearcherProfile() {
  const [profile, setProfile] = useState<ResearcherProfile | null>(null);
  const [state, setState] = useState<ProfileLoadState>("loading");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState("loading");
    setError(null);

    // Check sessionStorage cache first
    const cached = sessionStorage.getItem("ra-profile");
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as ResearcherProfile;
        setProfile(parsed);
        setState(isBlank(parsed.content) ? "onboarding" : "ready");
        return;
      } catch {
        sessionStorage.removeItem("ra-profile");
      }
    }

    try {
      const res = await fetch("/api/researcher/profile");
      if (res.status === 404) {
        setProfile(null);
        setState("onboarding");
        return;
      }
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = (await res.json()) as { content: string | null };
      if (data.content === null || isBlank(data.content)) {
        setProfile(null);
        setState("onboarding");
        return;
      }
      const loaded: ResearcherProfile = { content: data.content };
      sessionStorage.setItem("ra-profile", JSON.stringify(loaded));
      setProfile(loaded);
      setState("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setState("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(
    async (content: string): Promise<boolean> => {
      try {
        const res = await fetch("/api/researcher/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });
        if (!res.ok) return false;
        const next: ResearcherProfile = { content };
        sessionStorage.setItem("ra-profile", JSON.stringify(next));
        setProfile(next);
        setState("ready");
        return true;
      } catch {
        return false;
      }
    },
    []
  );

  const invalidateCache = useCallback(() => {
    sessionStorage.removeItem("ra-profile");
  }, []);

  return { profile, state, error, save, reload: load, invalidateCache };
}

/** Returns true if the Identity section Name line is blank (no content after ": "). */
export function isBlank(content: string): boolean {
  return /^- Name:\s*$/m.test(content);
}
