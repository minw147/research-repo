import chokidar from "chokidar";
import path from "path";

const PROJECTS_DIR = path.join(process.cwd(), "content/projects");

type FileChangeCallback = (data: { slug: string; file: string; event: string }) => void;

const listeners = new Set<FileChangeCallback>();
let watcher: chokidar.FSWatcher | null = null;

export function startWatcher() {
  if (watcher) return;
  watcher = chokidar.watch(PROJECTS_DIR, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 500, pollInterval: 100 },
  });

  watcher.on("change", (filePath) => {
    const rel = path.relative(PROJECTS_DIR, filePath);
    const parts = rel.split(path.sep);
    if (parts.length < 2) return;
    const slug = parts[0];
    const file = parts.slice(1).join("/");
    if (!/\.(md|mdx|json)$/.test(file)) return;
    for (const cb of listeners) {
      cb({ slug, file, event: "change" });
    }
  });
}

export function addListener(cb: FileChangeCallback) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
