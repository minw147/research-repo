interface BrandMarkProps {
  /** Icon badge size in px. Wordmark text scales with it via the `text` prop. */
  size?: number;
  /** Show the "Research Hub" wordmark next to the badge. */
  withWordmark?: boolean;
  /** Tailwind text-size class for the wordmark (defaults scale with size). */
  wordmarkClassName?: string;
}

export function BrandMark({ size = 22, withWordmark = true, wordmarkClassName }: BrandMarkProps) {
  const radius = size >= 28 ? 7 : 5;
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex shrink-0 items-center justify-center bg-pine-800"
        style={{ width: size, height: size, borderRadius: radius }}
      >
        <svg
          width={size * 0.6}
          height={size * 0.6}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M5 4 H19 A1 1 0 0 1 20 5 V21 L14.5 17.5 L9.5 21 L4 17.5 V5 A1 1 0 0 1 5 4 Z"
            stroke="#FAF7F2"
            strokeWidth={2}
            strokeLinejoin="round"
            fill="none"
          />
          <path d="M8 10 H16" stroke="#FAF7F2" strokeWidth={2} strokeLinecap="round" />
        </svg>
      </div>
      {withWordmark && (
        <span className={`font-serif font-semibold text-stone-900 ${wordmarkClassName ?? ""}`}>
          Research <span className="italic text-clay-600">Hub</span>
        </span>
      )}
    </div>
  );
}

export default BrandMark;
