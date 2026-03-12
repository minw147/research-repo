interface DividerProps {
  /** Optional label/emoji centered on the line */
  label?: React.ReactNode;
}

export function Divider({ label }: DividerProps) {
  if (label) {
    return (
      <div className="report-divider my-10 flex items-center gap-4" aria-hidden>
        <span className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-slate-300 dark:via-slate-600 dark:to-slate-600" />
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {label}
        </span>
        <span className="h-px flex-1 bg-gradient-to-l from-transparent via-slate-300 to-slate-300 dark:via-slate-600 dark:to-slate-600" />
      </div>
    );
  }
  return (
    <hr
      className="report-divider my-8 border-0 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-600"
      aria-hidden
    />
  );
}

export default Divider;
