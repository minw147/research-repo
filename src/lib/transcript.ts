export interface TranscriptLine {
  sec: number;
  text: string;
}

export function parseTranscript(raw: string): TranscriptLine[] {
  const lines: TranscriptLine[] = [];
  raw.split("\n").forEach((line) => {
    const m = line.match(/\[(\d{1,2}):(\d{2})\]\s*(.*)/);
    if (m) {
      const sec = parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
      const text = m[3].trim();
      if (text) lines.push({ sec, text });
    } else if (line.trim() && lines.length > 0) {
      lines[lines.length - 1].text += " " + line.trim();
    }
  });
  return lines;
}

export function getTranscriptExcerpt(
  lines: TranscriptLine[],
  startSec: number,
  endSec: number
): string {
  return lines
    .filter((l) => l.sec >= startSec && l.sec < endSec)
    .map((l) => l.text)
    .join(" ");
}
