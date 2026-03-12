import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST() {
  // Only allow this if running locally (safety check)
  if (process.env.NODE_ENV === "production" && !process.env.ALLOW_REMOTE_PICKER) {
    return NextResponse.json({ error: "Picker only available in local development" }, { status: 403 });
  }

  try {
    let command = "";
    if (process.platform === "win32") {
      // Robust way to find powershell.exe
      let psPath = "powershell.exe";
      try {
        const { stdout: wherePs } = await execAsync("where powershell.exe");
        psPath = wherePs.split("\n")[0].trim() || "powershell.exe";
      } catch {
        psPath = "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe";
      }
      
      console.log("Using PowerShell at:", psPath);
      
      // Use a single line command that is less likely to be mangled by shell quoting
      const psCommand = `Add-Type -AssemblyName System.Windows.Forms; $d = New-Object System.Windows.Forms.FolderBrowserDialog; $d.Description = 'Select Destination Folder'; if($d.ShowDialog() -eq 'OK') { $d.SelectedPath }`;
      command = `"${psPath}" -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "${psCommand}"`;
    } else if (process.platform === "darwin") {
      // macOS AppleScript to open folder picker
      command = `osascript -e 'POSIX path of (choose folder with prompt "Select Destination Folder")'`;
    } else {
      // Linux (requires zenity or similar)
      command = `zenity --file-selection --directory --title="Select Destination Folder"`;
    }

    const { stdout, stderr } = await execAsync(command);
    console.log("Folder picker stdout:", stdout);
    
    if (stderr && !stderr.includes("skipped")) {
      console.error("Folder picker stderr:", stderr);
      // Don't return 500 immediately if there's some stderr, sometimes there are warnings
    }

    const path = stdout.trim();
    if (!path) {
      return NextResponse.json({ cancelled: true });
    }

    return NextResponse.json({ path });
  } catch (error: any) {
    // If command failed (e.g. user cancelled with non-zero exit code or tool missing)
    if (error.code === 1 || error.message?.includes("cancelled")) {
      return NextResponse.json({ cancelled: true });
    }
    console.error("Folder picker exception:", error);
    return NextResponse.json({ error: "Folder picker not supported on this system or tool missing" }, { status: 500 });
  }
}
