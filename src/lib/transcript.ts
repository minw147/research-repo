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

/** Format seconds as VTT timestamp (HH:MM:SS.mmm) */
function secToVtt(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.round((sec % 1) * 1000) % 1000;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}`;
}

/** Generate VTT for a clip segment using transcript timestamps directly.
 *  One cue per transcript line: start = line.sec, end = next line's sec. Rebase to 0 for sliced clips. */
export function getClipVtt(
  lines: TranscriptLine[],
  startSec: number,
  endSec: number
): string {
  const clipLines = lines.filter((l) => l.sec >= startSec && l.sec < endSec);
  if (clipLines.length === 0) return "";

  const clipDuration = endSec - startSec;
  let vtt = "WEBVTT\n\n";

  for (let i = 0; i < clipLines.length; i++) {
    const origStart = clipLines[i].sec;
    const origEnd =
      i + 1 < clipLines.length
        ? clipLines[i + 1].sec
        : Math.min(origStart + 10, endSec);
    const rebasedStart = origStart - startSec;
    const rebasedEnd = Math.min(origEnd - startSec, clipDuration);
    if (rebasedEnd <= rebasedStart) continue;

    const text = clipLines[i].text.replace(/\n/g, " ").trim();
    const startTs = secToVtt(rebasedStart);
    const endTs = secToVtt(Math.max(rebasedStart + 0.001, rebasedEnd));
    vtt += `${i + 1}\n${startTs} --> ${endTs}\n${text}\n\n`;
  }
  return vtt;
}
