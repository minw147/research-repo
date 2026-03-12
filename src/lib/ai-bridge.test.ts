import { describe, it, expect, vi, beforeEach } from "vitest";
import { spawn } from "child_process";
import { detectClaudeCli, runClaudePrompt } from "./ai-bridge";
import { EventEmitter } from "events";

// Mock child_process
vi.mock("child_process", () => {
  const spawnMock = vi.fn();
  return {
    spawn: spawnMock,
    default: {
      spawn: spawnMock,
    },
  };
});

describe("ai-bridge", () => {
  const createMockProcess = () => {
    const mockProcess = new EventEmitter() as any;
    mockProcess.stdout = new EventEmitter();
    mockProcess.stderr = new EventEmitter();
    return mockProcess;
  };

  beforeEach(() => {
    vi.mocked(spawn).mockReset();
  });

  describe("detectClaudeCli", () => {
    it("returns true when claude --version exits with 0", async () => {
      const mockProcess = createMockProcess();
      vi.mocked(spawn).mockReturnValue(mockProcess);

      const promise = detectClaudeCli();
      mockProcess.emit("exit", 0);
      const result = await promise;

      expect(result).toBe(true);
      expect(spawn).toHaveBeenCalledWith("claude", ["--version"], { shell: true });
    });

    it("returns false when claude --version exits with non-zero code", async () => {
      const mockProcess = createMockProcess();
      vi.mocked(spawn).mockReturnValue(mockProcess);

      const promise = detectClaudeCli();
      mockProcess.emit("exit", 1);
      const result = await promise;

      expect(result).toBe(false);
    });

    it("returns false when claude --version errors", async () => {
      const mockProcess = createMockProcess();
      vi.mocked(spawn).mockReturnValue(mockProcess);

      const promise = detectClaudeCli();
      mockProcess.emit("error", new Error("spawn failed"));
      const result = await promise;

      expect(result).toBe(false);
    });
  });

  describe("runClaudePrompt", () => {
    const workingDir = "/test/dir";

    it("returns trimmed stdout when exit code is 0", async () => {
      const mockProcess = createMockProcess();
      vi.mocked(spawn).mockReturnValue(mockProcess);

      const promise = runClaudePrompt("Hello Claude", workingDir);
      
      mockProcess.stdout.emit("data", Buffer.from("  Hello from Claude  \n"));
      mockProcess.emit("exit", 0);
      
      const result = await promise;
      expect(result).toBe("Hello from Claude");
      expect(spawn).toHaveBeenCalledWith(
        "claude",
        ["-p", "Hello Claude", "--output-format", "text"],
        { cwd: workingDir, shell: true }
      );
    });

    it("rejects with stderr when exit code is non-zero", async () => {
      const mockProcess = createMockProcess();
      vi.mocked(spawn).mockReturnValue(mockProcess);

      const promise = runClaudePrompt("Hello Claude", workingDir);
      
      mockProcess.stderr.emit("data", Buffer.from("Error occurred"));
      mockProcess.emit("exit", 1);
      
      await expect(promise).rejects.toThrow("Error occurred");
    });

    it("rejects with generic error when exit code is non-zero and stderr is empty", async () => {
      const mockProcess = createMockProcess();
      vi.mocked(spawn).mockReturnValue(mockProcess);

      const promise = runClaudePrompt("Hello Claude", workingDir);
      
      mockProcess.emit("exit", 1);
      
      await expect(promise).rejects.toThrow("Claude CLI exited with code 1");
    });

    it("rejects when spawn errors", async () => {
      const mockProcess = createMockProcess();
      vi.mocked(spawn).mockReturnValue(mockProcess);

      const promise = runClaudePrompt("Hello Claude", workingDir);
      
      mockProcess.emit("error", new Error("Fatal spawn error"));
      
      await expect(promise).rejects.toThrow("Fatal spawn error");
    });
  });
});
