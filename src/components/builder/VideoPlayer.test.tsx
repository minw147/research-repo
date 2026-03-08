import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import VideoPlayer, { type VideoPlayerRef } from "./VideoPlayer";
import type { Session } from "@/types";

afterEach(cleanup);

// Mock video element methods
beforeEach(() => {
  vi.spyOn(HTMLVideoElement.prototype, "play").mockImplementation(() => Promise.resolve());
  vi.spyOn(HTMLVideoElement.prototype, "pause").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

const mockSessions: Session[] = [
  {
    id: "session-1",
    participant: "Participant 1",
    videoFile: "video-1.mp4",
    transcriptFile: "transcript-1.vtt",
  },
  {
    id: "session-2",
    participant: "Participant 2",
    videoFile: "video-2.mp4",
    transcriptFile: "transcript-2.vtt",
  },
];

describe("VideoPlayer", () => {
  it("renders with active session", () => {
    const onSessionChange = vi.fn();
    const { container } = render(
      <VideoPlayer
        sessions={mockSessions}
        activeSessionIndex={0}
        onSessionChange={onSessionChange}
        slug="test-project"
      />
    );

    expect(screen.getByText("Participant 1")).toBeInTheDocument();
    expect(screen.getByText("video-1.mp4")).toBeInTheDocument();
    
    const video = container.querySelector("video");
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute("src", "/api/projects/test-project/videos/video-1.mp4");
  });

  it("calls onSessionChange when dropdown changes", () => {
    const onSessionChange = vi.fn();
    render(
      <VideoPlayer
        sessions={mockSessions}
        activeSessionIndex={0}
        onSessionChange={onSessionChange}
        slug="test-project"
      />
    );

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "1" } });

    expect(onSessionChange).toHaveBeenCalledWith(1);
  });

  it("exposes seekTo and playRange via ref", () => {
    const onSessionChange = vi.fn();
    const ref = React.createRef<VideoPlayerRef>();
    render(
      <VideoPlayer
        ref={ref}
        sessions={mockSessions}
        activeSessionIndex={0}
        onSessionChange={onSessionChange}
        slug="test-project"
      />
    );

    expect(ref.current).toBeDefined();
    expect(ref.current?.seekTo).toBeTypeOf("function");
    expect(ref.current?.playRange).toBeTypeOf("function");
  });

  it("seekTo updates video currentTime", () => {
    const onSessionChange = vi.fn();
    const ref = React.createRef<VideoPlayerRef>();
    const { container } = render(
      <VideoPlayer
        ref={ref}
        sessions={mockSessions}
        activeSessionIndex={0}
        onSessionChange={onSessionChange}
        slug="test-project"
      />
    );

    const video = container.querySelector("video") as HTMLVideoElement;
    ref.current?.seekTo(10);
    expect(video.currentTime).toBe(10);
  });

  it("playRange starts playback and pauses at end", () => {
    const onSessionChange = vi.fn();
    const ref = React.createRef<VideoPlayerRef>();
    const { container } = render(
      <VideoPlayer
        ref={ref}
        sessions={mockSessions}
        activeSessionIndex={0}
        onSessionChange={onSessionChange}
        slug="test-project"
      />
    );

    const video = container.querySelector("video") as HTMLVideoElement;
    const playSpy = vi.spyOn(video, "play");
    const pauseSpy = vi.spyOn(video, "pause");

    // Start playRange from 5 to 10
    ref.current?.playRange(5, 10);
    expect(video.currentTime).toBe(5);
    expect(playSpy).toHaveBeenCalled();

    // Trigger timeupdate before end
    video.currentTime = 8;
    fireEvent.timeUpdate(video);
    expect(pauseSpy).not.toHaveBeenCalled();

    // Trigger timeupdate at end
    video.currentTime = 10;
    fireEvent.timeUpdate(video);
    expect(pauseSpy).toHaveBeenCalled();
  });
});
