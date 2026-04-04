"use client";
import { useState, useEffect, useRef } from "react";

interface ResearchAssistantSettingsProps {
  preferredName: string;
  botName: string;
  onSave: (preferredName: string, botName: string) => void;
  onClose: () => void;
  onResetProfile: () => void;
}

export function ResearchAssistantSettings({
  preferredName,
  botName,
  onSave,
  onClose,
  onResetProfile,
}: ResearchAssistantSettingsProps) {
  const [localPreferredName, setLocalPreferredName] = useState(preferredName);
  const [localBotName, setLocalBotName] = useState(botName);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  function handleSave() {
    onSave(localPreferredName.trim(), localBotName.trim() || "Sage");
    onClose();
  }

  return (
    <div
      className="absolute right-0 top-0 z-10 h-full w-full rounded-xl border border-slate-200 bg-white p-4"
      style={{ animation: "slideInRight 100ms ease-out" }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Settings</h3>
        <button
          onClick={onClose}
          aria-label="Close settings"
          className="min-h-[44px] min-w-[44px] rounded text-slate-400 hover:text-slate-600 focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="ra-preferred-name">
            Your preferred name
          </label>
          <input
            ref={firstInputRef}
            id="ra-preferred-name"
            type="text"
            value={localPreferredName}
            onChange={(e) => setLocalPreferredName(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            placeholder="e.g. Alex"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="ra-bot-name">
            Bot name
          </label>
          <input
            id="ra-bot-name"
            type="text"
            value={localBotName}
            onChange={(e) => setLocalBotName(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            placeholder="Sage"
          />
        </div>

        <button
          onClick={handleSave}
          className="min-h-[44px] w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          Save
        </button>

        <hr className="border-slate-100" />

        <button
          onClick={onResetProfile}
          className="min-h-[44px] w-full rounded-lg px-4 py-2 text-xs text-slate-400 hover:text-slate-600 focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          Reset profile &amp; re-run onboarding
        </button>
      </div>
    </div>
  );
}
