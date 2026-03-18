"use client";
import { useState, useEffect, useCallback } from "react";
import type { AgentSettings } from "@/lib/agent-settings";

export function useAgentSettings() {
  const [settings, setSettings] = useState<AgentSettings>({ cli: "claude" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/agent-settings")
      .then((r) => r.json())
      .then((s) => {
        setSettings(s);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const save = useCallback(async (next: AgentSettings) => {
    setSettings(next);
    await fetch("/api/agent-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    }).catch(() => {});
  }, []);

  return { settings, loading, save };
}
