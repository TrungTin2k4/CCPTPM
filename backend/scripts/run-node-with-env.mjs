import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "node:child_process";

function parseEnvFile(content) {
  const parsed = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const normalized = line.startsWith("export ") ? line.slice(7).trim() : line;
    const separatorIndex = normalized.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const key = normalized.slice(0, separatorIndex).trim();
    let value = normalized.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    parsed[key] = value;
  }

  return parsed;
}

const [, , envFileArg, scriptArg, ...scriptArgs] = process.argv;

if (!envFileArg || !scriptArg) {
  console.error(
    "Usage: node scripts/run-node-with-env.mjs <env-file> <node-script> [...args]",
  );
  process.exit(1);
}

const envFilePath = resolve(process.cwd(), envFileArg);
const scriptPath = resolve(process.cwd(), scriptArg);

if (!existsSync(envFilePath)) {
  console.error(`Env file not found: ${envFilePath}`);
  process.exit(1);
}

if (!existsSync(scriptPath)) {
  console.error(`Node script not found: ${scriptPath}`);
  process.exit(1);
}

const fileEnv = parseEnvFile(readFileSync(envFilePath, "utf8"));

for (const [key, value] of Object.entries(fileEnv)) {
  if (process.env[key] === undefined) {
    process.env[key] = value;
  }
}

const child = spawn(process.execPath, [scriptPath, ...scriptArgs], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

child.on("error", (error) => {
  console.error(`Failed to start ${scriptPath}: ${error.message}`);
  process.exit(1);
});
