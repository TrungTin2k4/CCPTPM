import process from "node:process";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:8080";
const intervalMs = Number(process.env.MONITOR_INTERVAL_MS ?? "10000");
const maxFailures = Number(process.env.MONITOR_MAX_FAILURES ?? "3");
const healthPath = process.env.HEALTH_PATH ?? "/api/health";

let consecutiveFailures = 0;

async function probeHealth() {
  const response = await fetch(`${baseUrl}${healthPath}`, {
    headers: {
      Accept: "application/json",
    },
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(`Health probe returned ${response.status}: ${JSON.stringify(payload)}`);
  }

  return payload?.data ?? payload;
}

async function tick() {
  try {
    const report = await probeHealth();
    consecutiveFailures = 0;
    console.log(`[monitor] healthy ${new Date().toISOString()}`, report);
  } catch (error) {
    consecutiveFailures += 1;
    console.error(`[monitor] failed ${new Date().toISOString()}`, {
      consecutiveFailures,
      maxFailures,
      message: error instanceof Error ? error.message : String(error),
    });

    if (consecutiveFailures >= maxFailures) {
      console.error("[monitor] failure threshold reached, exiting non-zero for supervisor/CI");
      process.exit(1);
    }
  }
}

console.log("[monitor] starting release monitor", {
  baseUrl,
  healthPath,
  intervalMs,
  maxFailures,
});

await tick();
setInterval(tick, intervalMs);
