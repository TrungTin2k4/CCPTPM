import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

function getEnv(name) {
  const value = process.env[name];

  if (!value || value.trim().length === 0) {
    throw new Error(`${name} is required`);
  }

  return value;
}

function run(command, options = {}) {
  console.log(`[rollback] ${command}`);
  execSync(command, {
    stdio: "inherit",
    ...options,
  });
}

function getReleaseDirectories(releasesDir) {
  return fs
    .readdirSync(releasesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({
      name: entry.name,
      path: path.join(releasesDir, entry.name),
      mtimeMs: fs.statSync(path.join(releasesDir, entry.name)).mtimeMs,
    }))
    .sort((a, b) => b.mtimeMs - a.mtimeMs);
}

async function main() {
  const releasesDir = getEnv("RELEASES_DIR");
  const currentLinkPath = getEnv("CURRENT_LINK_PATH");
  const healthCommand = process.env.ROLLBACK_HEALTH_COMMAND ?? "npm run health:check";
  const restartCommand = process.env.ROLLBACK_RESTART_COMMAND ?? "";
  const requestedTarget = process.env.ROLLBACK_TARGET?.trim() ?? "";

  const releases = getReleaseDirectories(releasesDir);

  if (releases.length < 2 && !requestedTarget) {
    throw new Error("At least two releases are required to rollback automatically");
  }

  const currentRealPath = fs.existsSync(currentLinkPath) ? fs.realpathSync(currentLinkPath) : null;
  const targetRelease = requestedTarget
    ? path.join(releasesDir, requestedTarget)
    : releases.find((release) => release.path !== currentRealPath)?.path;

  if (!targetRelease || !fs.existsSync(targetRelease)) {
    throw new Error("Rollback target release was not found");
  }

  console.log("[rollback] current release", currentRealPath);
  console.log("[rollback] target release", targetRelease);

  if (fs.existsSync(currentLinkPath)) {
    const currentStats = fs.lstatSync(currentLinkPath);

    if (!currentStats.isSymbolicLink()) {
      throw new Error("CURRENT_LINK_PATH must be an existing symbolic link");
    }
  }

  const tempLinkPath = `${currentLinkPath}.rollback-tmp`;
  fs.rmSync(tempLinkPath, { force: true });
  fs.symlinkSync(targetRelease, tempLinkPath);
  fs.renameSync(tempLinkPath, currentLinkPath);

  if (restartCommand) {
    run(restartCommand, {
      cwd: currentLinkPath,
      shell: true,
    });
  }

  run(healthCommand, {
    cwd: currentLinkPath,
    shell: true,
  });

  console.log("[rollback] completed successfully");
}

main().catch((error) => {
  console.error("[rollback] failed", error instanceof Error ? error.message : error);
  process.exit(1);
});
