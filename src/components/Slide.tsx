interface SlideProps {
  children: React.ReactNode;
  /**
   * "auto"  — slide grows naturally with its content (default)
   * "tall"  — adds generous min-height for content-dense or clip-heavy slides
   */
  size?: "auto" | "tall";
}

export function Slide({ children, size = "auto" }: SlideProps) {
  return (
    <div
      className={[
        "slide-section",
        "relative mb-10 overflow-hidden rounded-2xl bg-white",
        "shadow-[0_2px_12px_0_rgba(0,0,0,0.06)] ring-1 ring-slate-100",
        "transition-shadow duration-200 hover:shadow-[0_4px_20px_0_rgba(0,0,0,0.1)]",
        size === "tall" ? "min-h-[36rem]" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Gradient top stripe */}
      <div className="h-[3px] w-full bg-gradient-to-r from-primary via-blue-400 to-primary-dark" />

      {/* Slide number badge — rendered via CSS counter in globals.css */}
      <div className="slide-counter-badge" aria-hidden="true" />

      {/* Content */}
      <div className="px-8 pb-10 pt-8 sm:px-12 sm:pt-10">{children}</div>
    </div>
  );
}

export default Slide;
