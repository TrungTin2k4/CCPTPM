import process from "node:process";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:8080";
const timeoutMs = Number(process.env.HEALTH_TIMEOUT_MS ?? "5000");
const healthPath = process.env.HEALTH_PATH ?? "/api/health";

async function main() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}${healthPath}`, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      console.error("Health check failed", {
        status: response.status,
        payload,
      });
      process.exit(1);
    }

    const report = payload?.data ?? payload;
    console.log("Health check passed", {
      url: `${baseUrl}${healthPath}`,
      status: response.status,
      report,
    });
  } catch (error) {
    console.error("Health check failed", {
      url: `${baseUrl}${healthPath}`,
      message: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  } finally {
    clearTimeout(timeout);
  }
}

await main();
