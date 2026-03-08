import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import VideoPlayer, { type VideoPlayerRef } from "./VideoPlayer";
import type { Session } from "@/types";

afterEach(cleanup);

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
});
