import { corsPreflight } from "@/utils/cors";
import { fail, ok, withErrorHandling } from "@/utils/http";
import { getHealthReport } from "@/utils/health";

export async function OPTIONS(request) {
  return corsPreflight(request);
}

export async function GET(request) {
  return withErrorHandling(request, async () => {
    const report = await getHealthReport();

    if (report.status !== "ok") {
      return fail(request, 503, "Service is unhealthy", report);
    }

    return ok(request, report, "Service is healthy");
  });
}
