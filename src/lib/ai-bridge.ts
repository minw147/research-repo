import { spawn } from "child_process";

/**
 * Detects if the Claude CLI is installed and available in the system path.
 * Runs `claude --version` to verify.
 */
export async function detectClaudeCli(): Promise<boolean> {
  return new Promise((resolve) => {
    const proc = spawn("claude", ["--version"], { shell: true });
    proc.on("error", () => resolve(false));
    proc.on("exit", (code) => resolve(code === 0));
  });
}

/**
 * Runs a prompt through the Claude CLI and returns the output.
 * @param prompt The prompt to send to Claude
 * @returns The stdout from the Claude CLI, trimmed
 */
export async function runClaudePrompt(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn("claude", [prompt], { shell: true });
    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => (stdout += data.toString()));
    proc.stderr.on("data", (data) => (stderr += data.toString()));

    proc.on("error", (err) => reject(err));
    proc.on("exit", (code) => {
      if (code === 0) resolve(stdout.trim());
      else reject(new Error(stderr || `Claude CLI exited with code ${code}`));
    });
  });
}
