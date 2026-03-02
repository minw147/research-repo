"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Search, Bell } from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/library", label: "Library" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isReport = pathname?.startsWith("/reports/");
  const isLibrary = pathname === "/library";
  const activeLabel = isReport || isLibrary ? "Library" : "Dashboard";

  return (
    <div className="flex min-h-screen w-full flex-col overflow-hidden bg-background-light">
      {/* Global Header */}
      <header className="no-print sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 text-slate-900 no-underline"
        >
          <BookOpen className="h-6 w-6 text-primary" strokeWidth={2} />
          <span className="text-lg font-bold">Research Repo</span>
        </Link>

        {/* Search */}
        <div className="relative mx-4 hidden flex-1 max-w-md sm:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search insights..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Nav + Actions */}
        <div className="flex shrink-0 items-center gap-6">
          <nav className="flex items-center gap-1">
            {navItems.map(({ href, label }) => (
              <Link
                key={label}
                href={href}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  label === activeLabel
                    ? "text-primary"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
          <button
            type="button"
            aria-label="Notifications"
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            <Bell className="h-5 w-5" />
          </button>
          <div className="h-8 w-8 shrink-0 rounded-full bg-slate-300" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl w-full px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
