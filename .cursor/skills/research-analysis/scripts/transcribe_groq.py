#!/usr/bin/env python3
"""
Transcribe audio/video using Groq's Whisper API.
Output: timestamped transcript for research-repo Clip components.

Requires: pip install groq
Env: GROQ_API_KEY (get from https://console.groq.com/keys)

Usage:
  python .cursor/skills/research-analysis/scripts/transcribe_groq.py public/videos/file.mp4
  python .cursor/skills/research-analysis/scripts/transcribe_groq.py input.mp4 -o data/transcripts/ai-chip-war.txt
"""

import argparse
import os
import subprocess
import sys
from pathlib import Path

try:
    from groq import Groq
except ImportError:
    print("Error: groq package not installed. Run: pip install groq")
    sys.exit(1)

# Project root (from .cursor/skills/research-analysis/scripts/)
ROOT = Path(__file__).resolve().parent.parent.parent.parent.parent


def find_api_key() -> str | None:
    key = os.getenv("GROQ_API_KEY")
    if key:
        return key
    env_file = ROOT / ".env"
    if env_file.exists():
        with open(env_file) as f:
            for line in f:
                if line.strip().startswith("GROQ_API_KEY="):
                    return line.split("=", 1)[1].strip().strip('"\'')
    return None


def ensure_audio_small_enough(path: Path, max_mb: float = 24) -> Path:
    """Extract audio to FLAC if file is too large. Groq limit: 25MB free, 100MB dev."""
    size_mb = path.stat().st_size / (1024 * 1024)
    if size_mb <= max_mb:
        return path

    out = path.with_suffix(".flac")
    if out.exists() and out.stat().st_size / (1024 * 1024) <= max_mb:
        return out

    ffmpeg_cmd = "ffmpeg"
    try:
        import imageio_ffmpeg
        ffmpeg_cmd = imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        pass

    try:
        print(f"File {size_mb:.1f}MB exceeds {max_mb}MB. Extracting audio to FLAC...")
        subprocess.run(
            [ffmpeg_cmd, "-y", "-i", str(path), "-ar", "16000", "-ac", "1", "-map", "0:a", "-c:a", "flac", str(out)],
            check=True,
            capture_output=True,
        )
        return out
    except (FileNotFoundError, subprocess.CalledProcessError):
        pass

    if size_mb <= 95:
        print(f"File {size_mb:.1f}MB - trying direct upload (Groq dev tier allows 100MB)")
        return path

    print(f"Error: File {size_mb:.1f}MB too large. Install FFmpeg to extract audio: winget install ffmpeg")
    sys.exit(1)


def transcribe(client: Groq, audio_path: Path, prompt: str | None = None) -> dict:
    with open(audio_path, "rb") as f:
        return client.audio.transcriptions.create(
            file=(audio_path.name, f.read()),
            model="whisper-large-v3-turbo",
            response_format="verbose_json",
            timestamp_granularities=["segment"],
            language="en",
            prompt=prompt or "Podcast about AI chips, GPUs, TPUs, and technology.",
            temperature=0.0,
        )


def format_for_research_repo(transcription) -> str:
    """Format transcript with [MM:SS] prefix per segment for Clip start values."""
    segs = getattr(transcription, "segments", None)
    if segs is None:
        segs = getattr(transcription, "words", None)
    if segs is None and hasattr(transcription, "model_dump"):
        d = transcription.model_dump()
        segs = d.get("segments", d.get("words", []))
    segs = segs or []

    lines = []
    for seg in segs:
        d = seg if isinstance(seg, dict) else (seg.__dict__ if hasattr(seg, "__dict__") else {})
        start = d.get("start", d.get("start_time", 0))
        m = int(start // 60)
        sec = int(start % 60)
        ts = f"[{m:02d}:{sec:02d}]"
        text = (d.get("text") or getattr(seg, "text", "") or "").strip()
        if text:
            lines.append(f"{ts} {text}")

    if not lines and hasattr(transcription, "text"):
        return transcription.text or ""
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="Transcribe audio/video with Groq Whisper")
    parser.add_argument("input", help="Audio or video file path")
    parser.add_argument("-o", "--output", help="Output transcript file (default: data/transcripts/<stem>.txt)")
    parser.add_argument("-p", "--prompt", help="Optional prompt for context (e.g. 'AI chips, GPUs, TPUs')")
    args = parser.parse_args()

    api_key = find_api_key()
    if not api_key:
        print("Error: GROQ_API_KEY not found.")
        print("Set via: export GROQ_API_KEY='your-key'")
        print("Or add to .env: GROQ_API_KEY=your-key")
        print("Get key: https://console.groq.com/keys")
        sys.exit(1)

    input_path = Path(args.input)
    if not input_path.is_absolute():
        input_path = ROOT / input_path
    if not input_path.exists():
        print(f"Error: File not found: {input_path}")
        sys.exit(1)

    output_path = ROOT / (args.output or f"data/transcripts/{input_path.stem}.txt")
    output_path.parent.mkdir(parents=True, exist_ok=True)

    audio_path = ensure_audio_small_enough(input_path)
    if audio_path != input_path and audio_path.suffix == ".flac":
        pass

    print(f"Transcribing: {audio_path}")
    client = Groq(api_key=api_key)
    result = transcribe(client, audio_path, args.prompt)

    formatted = format_for_research_repo(result)
    output_path.write_text(formatted, encoding="utf-8")
    print(f"Saved: {output_path}")
    print(f"Segments: {len(getattr(result, 'segments', []) or [])}")


if __name__ == "__main__":
    main()
