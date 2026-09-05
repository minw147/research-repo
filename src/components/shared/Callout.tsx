import { Info, Lightbulb, AlertTriangle, Sparkles } from "lucide-react";

interface CalloutProps {
  children: React.ReactNode;
  /** "info" | "tip" | "warning" | "insight" */
  variant?: "info" | "tip" | "warning" | "insight";
  /** Optional short label shown above content (e.g. "Key takeaway", "💡") */
  title?: React.ReactNode;
}

const variants = {
  info: {
    bg: "bg-primary/10",
    border: "border-l-primary",
    icon: <Info className="w-4 h-4 shrink-0" aria-hidden="true" />,
    title: "text-primary-dark",
  },
  tip: {
    bg: "bg-emerald-50",
    border: "border-l-emerald-500",
    icon: <Lightbulb className="w-4 h-4 shrink-0" aria-hidden="true" />,
    title: "text-emerald-800",
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-l-amber-500",
    icon: <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />,
    title: "text-amber-800",
  },
  insight: {
    bg: "bg-violet-50",
    border: "border-l-violet-500",
    icon: <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />,
    title: "text-violet-800",
  },
};

export function Callout({
  children,
  variant = "info",
  title,
}: CalloutProps) {
  const v = variants[variant];
  return (
    <div
      className={[
        "report-callout my-6 rounded-r-lg border-l-4 px-5 py-4",
        v.bg,
        v.border,
      ].join(" ")}
    >
      {title && (
        <div
          className={[
            "mb-2 flex items-center gap-2 text-sm font-semibold",
            v.title,
          ].join(" ")}
        >
          {v.icon}
          <span>{title}</span>
        </div>
      )}
      <div className="report-callout-content text-slate-700 [&>p:last-child]:mb-0">
        {children}
      </div>
    </div>
  );
}

export default Callout;
