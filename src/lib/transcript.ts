export interface TranscriptLine {
  sec: number;
  text: string;
}

/** Strip redundant timestamps and trailing segment numbers from cue text for display */
export function cleanTranscriptText(text: string): string {
  let t = text.trim();
  // Strip leading [MM:SS] or [H:MM:SS]
  t = t.replace(/^\[\d{1,2}(?::\d{2})?:\d{2}\]\s*/, "");
  // Strip leading .000 → HH:MM:SS.mmm or similar
  t = t.replace(/^\.\d{3}\s*[→\-]\s*\d{1,2}:\d{2}:\d{2}\.\d{3}\s*/, "");
  // Strip leading HH:MM:SS.mmm --> HH:MM:SS.mmm (VTT cue line embedded in text)
  t = t.replace(/^\d{1,2}:\d{2}:\d{2}\.\d{3}\s*-->\s*\d{1,2}:\d{2}:\d{2}\.\d{3}\s*/, "");
  // Strip trailing segment/cue number (e.g. " 3", " 42")
  t = t.replace(/\s+\d+$/, "");
  return t.trim();
}

/** VTT timestamp line: HH:MM:SS.mmm --> HH:MM:SS.mmm (start time is first group) */
const VTT_TIMESTAMP_LINE = /^(\d{1,2}):(\d{2}):(\d{2})\.(\d{3})\s*-->/;

/** Parse WEBVTT: cue blocks (optional id, timestamp line, then text lines). Uses start time of each cue. */
function parseVtt(raw: string): TranscriptLine[] {
  const lines: TranscriptLine[] = [];
  const inputLines = raw.split("\n");
  let i = 0;
  while (i < inputLines.length) {
    const line = inputLines[i].trim();
    i++;
    const timeMatch = line.match(VTT_TIMESTAMP_LINE);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      const seconds = parseInt(timeMatch[3], 10);
      const ms = parseInt(timeMatch[4], 10);
      const sec = hours * 3600 + minutes * 60 + seconds + ms / 1000;
      const textLines: string[] = [];
      while (i < inputLines.length && inputLines[i].trim() !== "") {
        textLines.push(inputLines[i].trim());
        i++;
      }
      const text = textLines.join(" ");
      const cleaned = cleanTranscriptText(text);
      if (cleaned) lines.push({ sec: Math.floor(sec), text: cleaned });
      continue;
    }
    // Skip WEBVTT header, empty lines, or cue id-only lines until we hit a timestamp line
  }
  return lines;
}

/** Matches [MM:SS] or [H:MM:SS] or [HH:MM:SS] at start of line */
const BRACKET_TIMESTAMP = /^\[(?:(\d{1,2}):)?(\d{1,2}):(\d{2})\]\s*(.*)/;
/** Matches 00:00 or 0:00:00 at start of line (no brackets), optional " - " or " " before text */
const PLAIN_TIMESTAMP = /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(?:-\s*)?(.*)/;

function parseTimestampMatch(
  hours: number,
  minutes: number,
  seconds: number,
  text: string
): { sec: number; text: string } | null {
  const sec = hours * 3600 + minutes * 60 + seconds;
  const t = cleanTranscriptText(text.trim());
  return t ? { sec, text: t } : null;
}

export function parseTranscript(raw: string | null | undefined): TranscriptLine[] {
  if (raw == null || typeof raw !== "string") return [];
  const s = raw.trimStart();
  if (s.startsWith("WEBVTT")) {
    return parseVtt(raw);
  }
  const lines: TranscriptLine[] = [];
  raw.split("\n").forEach((line) => {
    let m = line.match(BRACKET_TIMESTAMP);
    if (m) {
      const hours = m[1] ? parseInt(m[1], 10) : 0;
      const minutes = parseInt(m[2], 10);
      const seconds = parseInt(m[3], 10);
      const parsed = parseTimestampMatch(hours, minutes, seconds, m[4] ?? "");
      if (parsed) lines.push(parsed);
      return;
    }
    m = line.match(PLAIN_TIMESTAMP);
    if (m) {
      let hours = 0;
      let minutes: number;
      let seconds: number;
      let text = (m[4] ?? "").trim();
      if (m[3] !== undefined && m[3] !== "") {
        hours = parseInt(m[1], 10);
        minutes = parseInt(m[2], 10);
        seconds = parseInt(m[3], 10);
      } else {
        minutes = parseInt(m[1], 10);
        seconds = parseInt(m[2], 10);
      }
      const parsed = parseTimestampMatch(hours, minutes, seconds, text);
      if (parsed) lines.push(parsed);
      return;
    }
    if (line.trim() && lines.length > 0) {
      lines[lines.length - 1].text += " " + cleanTranscriptText(line.trim());
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
