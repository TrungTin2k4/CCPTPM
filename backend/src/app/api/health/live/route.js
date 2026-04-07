import { corsPreflight } from "@/utils/cors";
import { ok, withErrorHandling } from "@/utils/http";

export async function OPTIONS(request) {
  return corsPreflight(request);
}

export async function GET(request) {
  return withErrorHandling(request, async () => {
    return ok(
      request,
      {
        status: "ok",
        service: "edulearn-backend",
        uptimeSeconds: Math.round(process.uptime()),
        timestamp: new Date().toISOString(),
      },
      "Service is alive",
    );
  });
}
