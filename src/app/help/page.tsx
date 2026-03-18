import Link from "next/link";
import { Box, HelpCircle } from "lucide-react";

export const metadata = {
  title: "Help — AI workflow",
  description: "How to use AI analysis in Research Hub with Cursor or your IDE",
};

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:text-sm focus:font-semibold"
      >
        Skip to content
      </a>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
            <Box className="h-5 w-5 text-primary" />
            <span>Research Hub</span>
          </Link>
          <span className="flex items-center gap-2 text-slate-500 text-sm">
            <HelpCircle className="h-4 w-4" />
            Help
          </span>
        </div>
      </header>

      <main id="main-content" className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          AI Analysis workflow
        </h1>
        <p className="mt-2 text-slate-600">
          Research Hub uses a copy-and-run workflow: the app generates prompts you paste into Cursor or your IDE. 
          The AI edits project files directly; you refresh the app to see changes.
        </p>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-slate-900">Step 1: Open AI Analysis</h2>
          <p className="mt-2 text-slate-600 text-sm">
            In the Findings, Tags, or Report page, click <strong>AI Analyze</strong>. Choose an action (e.g. Initial Findings, Tag Findings, AI synthesis).
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-slate-900">Step 2: Copy the prompt</h2>
          <p className="mt-2 text-slate-600 text-sm">
            The modal shows a generated prompt. Edit it if you like, then click <strong>Copy</strong>. The prompt is copied to your clipboard.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-slate-900">Step 3: Run the AI in your IDE</h2>
          <p className="mt-2 text-slate-600 text-sm">
            Paste the prompt into Cursor (or another AI-powered IDE). Run the agent. The AI will read project files and create or update files (e.g. <code className="bg-slate-100 px-1 rounded">findings.md</code>, <code className="bg-slate-100 px-1 rounded">tags.md</code>, <code className="bg-slate-100 px-1 rounded">findings.html</code>) in your project directory.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-slate-900">Step 4: Refresh to see changes</h2>
          <p className="mt-2 text-slate-600 text-sm">
            Return to Research Hub. Use the <strong>Refresh</strong> button, or wait for file-watch to pick up changes. Your updated document will appear.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-slate-900">Target files</h2>
          <p className="mt-2 text-slate-600 text-sm">
            Each AI action updates a specific file under <code className="bg-slate-100 px-1 rounded">content/projects/[slug]/</code>:
          </p>
          <ul className="mt-2 list-disc list-inside text-sm text-slate-600 space-y-1">
            <li>Initial Findings / Refine Findings → <code className="bg-slate-100 px-1 rounded">findings.md</code></li>
            <li>Tag Findings / Tag Transcripts → <code className="bg-slate-100 px-1 rounded">tags.md</code></li>
            <li>AI synthesis → <code className="bg-slate-100 px-1 rounded">findings.html</code></li>
          </ul>
        </section>

        <div className="mt-10 pt-6 border-t border-slate-200">
          <Link href="/" className="text-primary font-medium hover:underline text-sm">
            ← Back to Research Hub
          </Link>
        </div>
      </main>
    </div>
  );
}
