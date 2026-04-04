"use client";
import { useState } from "react";

interface OnboardingData {
  name: string;
  preferredName: string;
  role: string;
  botName: string;
}

interface ResearchOnboardingProps {
  onComplete: (data: OnboardingData) => Promise<void>;
  saveError: boolean;
}

const STEPS = ["Your name", "Your role", "Bot name", "Done"] as const;

export function ResearchOnboarding({ onComplete, saveError }: ResearchOnboardingProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [role, setRole] = useState("");
  const [botName, setBotName] = useState("Sage");
  const [saving, setSaving] = useState(false);
  const [inlineError, setInlineError] = useState(false);

  async function handleFinish() {
    setSaving(true);
    setInlineError(false);
    await onComplete({ name, preferredName, role, botName: botName.trim() || "Sage" });
    setSaving(false);
  }

  function next() {
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  return (
    <div className="flex h-full flex-col p-4">
      {/* Step indicator */}
      <div className="mb-6 flex items-center gap-2" role="list" aria-label="Onboarding steps">
        {STEPS.map((label, i) => (
          <div key={label} role="listitem" className="flex items-center gap-1">
            <div
              aria-current={i === step ? "step" : undefined}
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                i < step
                  ? "bg-primary text-white"
                  : i === step
                  ? "border-2 border-primary text-primary"
                  : "border border-slate-200 text-slate-400"
              }`}
            >
              {i < step ? "✓" : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-px w-4 ${i < step ? "bg-primary" : "bg-slate-200"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="flex-1">
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-slate-900">Welcome! What&apos;s your name?</h2>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="ob-name">
                Full name
              </label>
              <input
                id="ob-name"
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && name.trim() && next()}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                placeholder="e.g. Alex Chen"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="ob-preferred-name">
                Preferred name (optional)
              </label>
              <input
                id="ob-preferred-name"
                type="text"
                value={preferredName}
                onChange={(e) => setPreferredName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && name.trim() && next()}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                placeholder="e.g. Alex"
              />
            </div>
            <button
              onClick={next}
              disabled={!name.trim()}
              className="min-h-[44px] w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-40 focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Next
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-slate-900">What&apos;s your role?</h2>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="ob-role">
                Role / title
              </label>
              <input
                id="ob-role"
                autoFocus
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && next()}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                placeholder="e.g. UX Researcher"
              />
            </div>
            <button
              onClick={next}
              className="min-h-[44px] w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Next
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-slate-900">What should I call myself?</h2>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="ob-bot-name">
                Bot name
              </label>
              <input
                id="ob-bot-name"
                autoFocus
                type="text"
                value={botName}
                onChange={(e) => setBotName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleFinish()}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                placeholder="Sage"
              />
            </div>

            {(saveError || inlineError) && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
              >
                Couldn&apos;t save to researcher.md.{" "}
                <button
                  onClick={handleFinish}
                  className="underline hover:text-red-900"
                >
                  Retry
                </button>{" "}
                or{" "}
                <button
                  onClick={() => {
                    setInlineError(false);
                    next();
                  }}
                  className="underline hover:text-red-900"
                >
                  Continue anyway
                </button>
              </div>
            )}

            <button
              onClick={handleFinish}
              disabled={saving}
              className="min-h-[44px] w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-40 focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              {saving ? "Saving…" : "Get started"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
