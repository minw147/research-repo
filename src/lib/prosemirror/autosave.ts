export type FlushReason = "blur" | "drop" | "manual-save" | "delete";

export interface AutosaveOptions {
  /** Debounce interval before an in-memory (non-disk) change notification fires. */
  debounceMs: number;
  /** Called (debounced) after a doc-changing transaction — in-memory app state only. */
  onDebouncedChange: (markdown: string) => void;
  /** Called on an actual disk write. Never called for the debounced in-memory path. */
  onWrite: (markdown: string) => void;
  /** Serializes the current document to markdown. Called lazily, only when needed. */
  serialize: () => string;
  /**
   * Returns true if `candidate` looks suspiciously empty relative to `lastKnownGood` —
   * used to refuse a write that would silently blow away real content (e.g. a bad
   * parse). Overridable for testing; defaults to `defaultIsSuspiciouslyEmpty`.
   */
  isSuspiciouslyEmpty?: (candidate: string, lastKnownGood: string) => boolean;
}

export interface FlushResult {
  blocked: boolean;
  markdown: string;
}

export interface AutosaveController {
  /** Call on every dispatched transaction; only schedules work when docChanged is true. */
  onTransaction(docChanged: boolean): void;
  /** Cancels any pending debounce, serializes now, and writes to disk (unless blocked). */
  flushAndWrite(reason: FlushReason): FlushResult;
  /** Seeds the "last known good" baseline — call once when content is first loaded. */
  noteExternalKnownGood(markdown: string): void;
  /** Cancels any pending debounce timer without writing (e.g. on unmount). */
  dispose(): void;
}

const MIN_LENGTH_TO_GUARD = 200;
const SUSPICIOUS_RATIO = 0.15;

export function defaultIsSuspiciouslyEmpty(candidate: string, lastKnownGood: string): boolean {
  const goodLen = lastKnownGood.trim().length;
  if (goodLen < MIN_LENGTH_TO_GUARD) return false; // don't guard tiny/new documents
  return candidate.trim().length < goodLen * SUSPICIOUS_RATIO;
}

export function createAutosaveController(options: AutosaveOptions): AutosaveController {
  const isSuspiciouslyEmpty = options.isSuspiciouslyEmpty ?? defaultIsSuspiciouslyEmpty;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastKnownGood = "";

  function clearTimer() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  return {
    onTransaction(docChanged: boolean) {
      if (!docChanged) return;
      clearTimer();
      timer = setTimeout(() => {
        timer = null;
        options.onDebouncedChange(options.serialize());
      }, options.debounceMs);
    },

    flushAndWrite(_reason: FlushReason): FlushResult {
      clearTimer();
      const markdown = options.serialize();
      if (isSuspiciouslyEmpty(markdown, lastKnownGood)) {
        return { blocked: true, markdown };
      }
      lastKnownGood = markdown;
      options.onWrite(markdown);
      return { blocked: false, markdown };
    },

    noteExternalKnownGood(markdown: string) {
      lastKnownGood = markdown;
    },

    dispose() {
      clearTimer();
    },
  };
}
