"use client";

import Link from "next/link";
import { FlaskConical, HelpCircle, Zap, Shield, Brain, Layers, Globe } from "lucide-react";

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
            <FlaskConical className="h-5 w-5 text-primary" />
            <span>Research Hub</span>
          </Link>
          <span className="flex items-center gap-2 text-slate-500 text-sm">
            <HelpCircle className="h-4 w-4" />
            Help
          </span>
        </div>
      </header>

      <main id="main-content" className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">The Edge of Research</h1>
        <p className="mt-4 text-slate-600 text-lg">
          Research Hub isn&apos;t just another tool. It&apos;s a high-performance, <strong>100% open-source</strong> research engine that prioritizes your data, your privacy, and your evolution as a researcher.
        </p>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center mb-4 text-primary">
              <Globe className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-slate-900">100% Open Source</h3>
            <p className="mt-2 text-slate-600 text-sm leading-relaxed">
              No black boxes. No proprietary lock-in. You can see, touch, and fork every line of code. It&apos;s built for researchers who want full control over their process.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="h-10 w-10 bg-orange-100 rounded-xl flex items-center justify-center mb-4 text-orange-600">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-slate-900">100% Local (If You Want)</h3>
            <p className="mt-2 text-slate-600 text-sm leading-relaxed">
              Configure Research Hub to be 100% local. Use local storage and your own local LLM (via Ollama or LM Studio) to keep every byte of sensitive research data strictly on your machine.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="h-10 w-10 bg-violet-100 rounded-xl flex items-center justify-center mb-4 text-violet-600">
              <Brain className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-slate-900">A Learning Assistant</h3>
            <p className="mt-2 text-slate-600 text-sm leading-relaxed">
              The AI Research Assistant isn&apos;t a one-size-fits-all bot. It stores its observations in <code className="bg-slate-100 px-1 rounded text-xs">researcher.md</code>, learning your habits, your favorite frameworks, and your unique style over time.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center mb-4 text-blue-600">
              <Layers className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-slate-900">Ecosystem Power</h3>
            <p className="mt-2 text-slate-600 text-sm leading-relaxed">
              Directly connected to <strong>Cursor</strong> and <strong>Claude Code</strong>. Your assistant can instantly use all your existing skills and plugins with zero extra configuration. It&apos;s an IDE for research.
            </p>
          </div>
        </div>

        <section className="mt-16 border-t border-slate-200 pt-10">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Pro Workflow: The AI Analyze Bridge
          </h2>
          <p className="mt-4 text-slate-600 text-sm leading-relaxed">
            Research Hub uses a high-trust <strong>copy-and-run</strong> workflow. Instead of hiding the AI behind a button, we give you the prompt to run in your own agentic IDE (Cursor or Claude Code).
          </p>
          <div className="mt-6 space-y-6">
            <div className="flex gap-4">
              <span className="flex-shrink-0 h-6 w-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <div>
                <h4 className="font-semibold text-slate-900 text-sm">Open AI Analyze</h4>
                <p className="text-slate-600 text-sm mt-1">In Findings or Tags, click <strong>AI Analyze</strong>. Pick your mission: initial findings, tag synthesis, or a full report.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="flex-shrink-0 h-6 w-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <div>
                <h4 className="font-semibold text-slate-900 text-sm">Copy & Paste</h4>
                <p className="text-slate-600 text-sm mt-1">Copy the generated prompt and paste it into your IDE. Your local agent will read the files and perform the analysis.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="flex-shrink-0 h-6 w-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
              <div>
                <h4 className="font-semibold text-slate-900 text-sm">Sync Instantly</h4>
                <p className="text-slate-600 text-sm mt-1">The AI edits the files directly on your disk. Research Hub picks up the changes instantly via file-watching. No manual importing needed.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-16 bg-slate-900 rounded-3xl p-8 text-white">
          <h2 className="text-xl font-bold mb-4">The Result: Bulletproof Evidence</h2>
          <p className="text-slate-300 text-sm leading-relaxed mb-6">
            Whether you use the deterministic <strong>Build HTML</strong> tool for a 1-click report or a high-end <strong>AI Synthesis</strong>, your output is always backed by raw evidence. Every quote is a clip card. Every clip is a primary source.
          </p>
          <div className="grid grid-cols-2 gap-4 text-xs font-medium uppercase tracking-wider text-slate-400">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              Embedded Videos
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              Styled Callouts
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              Atomic Evidence
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              Cloud Sync Ready
            </div>
          </div>
        </section>

        <div className="mt-16 pt-10 border-t border-slate-200">
          <Link href="/" className="text-primary font-medium hover:underline text-sm inline-flex items-center gap-2">
            ← Back to the Hub
          </Link>
        </div>
      </main>
    </div>
  );
}
