import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

function findBash() {
  if (process.platform !== "win32") return "bash";

  const candidates = [
    process.env.ProgramFiles && join(process.env.ProgramFiles, "Git", "bin", "bash.exe"),
    process.env["ProgramFiles(x86)"] &&
      join(process.env["ProgramFiles(x86)"], "Git", "bin", "bash.exe"),
    process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, "Programs", "Git", "bin", "bash.exe"),
  ].filter(Boolean);

  return candidates.find((candidate) => existsSync(candidate));
}

const bash = findBash();
if (!bash) {
  console.error(
    "Git Bash is required to run the end-to-end suite on Windows. Install Git for Windows and retry.",
  );
  process.exit(1);
}

const result = spawnSync(bash, ["scripts/e2e.sh"], {
  env: process.env,
  stdio: "inherit",
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
