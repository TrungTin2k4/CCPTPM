import { corsPreflight } from "@/utils/cors";
import { ok, fail, withErrorHandling } from "@/utils/http";
import { parseJsonBody, validateBody } from "@/utils/request";
import { enforceAuthRateLimit } from "@/utils/rate-limit";
import { loginSchema } from "@/utils/schemas";
import { loginUser } from "@/controllers/auth-service";
import { InvalidCredentialsError } from "@/utils/errors";
export async function OPTIONS(request) {
    return corsPreflight(request);
}
export async function POST(request) {
    return withErrorHandling(request, async () => {
        enforceAuthRateLimit(request);
        const body = await parseJsonBody(request);
        const input = validateBody(loginSchema, body);
        let auth = null;
        try {
            auth = await loginUser(input, request);
        }
        catch (error) {
            if (error instanceof InvalidCredentialsError) {
                return fail(request, 401, error.message);
            }
            throw error;
        }
        if (!auth || !auth.token || !auth.user?.id) {
            return fail(request, 401, "Invalid email or password");
        }
        return ok(request, auth, "Login successful");
    });
}
