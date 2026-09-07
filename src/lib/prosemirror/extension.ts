import type { Schema } from "prosemirror-model";
import type { Command, Plugin } from "prosemirror-state";

export type ExtensionKind = "node" | "mark";

export abstract class Extension<Options extends Record<string, unknown> = Record<string, unknown>> {
  abstract readonly kind: ExtensionKind;
  abstract name: string;
  options: Options;

  constructor(options?: Partial<Options>) {
    this.options = { ...this.defaultOptions(), ...(options ?? {}) } as Options;
  }

  protected defaultOptions(): Options {
    return {} as Options;
  }

  /** Keymap entries this extension contributes (merged into one `keymap()` plugin). */
  keys?(schema: Schema): Record<string, Command>;

  /** Any additional ProseMirror plugins this extension needs registered. */
  plugins?(schema: Schema): Plugin[];
}
