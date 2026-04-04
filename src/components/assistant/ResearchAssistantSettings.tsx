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
      className="animate-slide-in-right absolute right-0 top-0 z-10 h-full w-full rounded-xl border border-[#4a3520]/60 bg-[#2a1f0e] p-4"
      style={{ animation: "slideInRight 100ms ease-out" }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-amber-100">Settings</h3>
        <button
          onClick={onClose}
          aria-label="Close settings"
          className="min-h-[44px] min-w-[44px] rounded text-amber-500 hover:text-amber-200 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[#2a1f0e]"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs text-amber-500" htmlFor="ra-preferred-name">
            Your preferred name
          </label>
          <input
            ref={firstInputRef}
            id="ra-preferred-name"
            type="text"
            value={localPreferredName}
            onChange={(e) => setLocalPreferredName(e.target.value)}
            className="w-full rounded border border-[#4a3520] bg-[#1c1108] px-3 py-2 text-sm text-amber-50 placeholder:text-amber-900/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[#2a1f0e]"
            placeholder="e.g. Alex"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-amber-500" htmlFor="ra-bot-name">
            Bot name
          </label>
          <input
            id="ra-bot-name"
            type="text"
            value={localBotName}
            onChange={(e) => setLocalBotName(e.target.value)}
            className="w-full rounded border border-[#4a3520] bg-[#1c1108] px-3 py-2 text-sm text-amber-50 placeholder:text-amber-900/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[#2a1f0e]"
            placeholder="Sage"
          />
        </div>

        <button
          onClick={handleSave}
          className="min-h-[44px] w-full rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[#2a1f0e]"
        >
          Save
        </button>

        <hr className="border-[#4a3520]/60" />

        <button
          onClick={onResetProfile}
          className="min-h-[44px] w-full rounded px-4 py-2 text-xs text-amber-700 hover:text-amber-500 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[#2a1f0e]"
        >
          Reset profile &amp; re-run onboarding
        </button>
      </div>
    </div>
  );
}
