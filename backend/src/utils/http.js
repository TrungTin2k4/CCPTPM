import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { buildCorsHeaders } from "@/utils/cors";
import { AppError, ValidationError } from "@/utils/errors";
import { buildRequestLogMeta, getRequestId, logError, logInfo, logWarn } from "@/utils/logger";
function mapZodError(error) {
    const fieldErrors = {};
    for (const issue of error.issues) {
        const key = issue.path.length > 0 ? String(issue.path[0]) : "request";
        if (!fieldErrors[key]) {
            fieldErrors[key] = issue.message;
        }
    }
    return fieldErrors;
}
function buildSuccessPayload(data, message) {
    return {
        success: true,
        message,
        data,
        timestamp: new Date().toISOString(),
    };
}
function buildErrorPayload(message, data) {
    return {
        success: false,
        message,
        data,
        timestamp: new Date().toISOString(),
    };
}
function isMongooseCastError(error) {
    return Boolean(error &&
        typeof error === "object" &&
        "name" in error &&
        error.name === "CastError");
}
function makeJsonResponse(request, payload, status, extraHeaders) {
    const headers = buildCorsHeaders(request);
    headers.set("x-request-id", getRequestId(request));
    if (extraHeaders) {
        for (const [key, value] of Object.entries(extraHeaders)) {
            headers.set(key, value);
        }
    }
    return NextResponse.json(payload, {
        status,
        headers,
    });
}
export function ok(request, data, message, status = 200) {
    return makeJsonResponse(request, buildSuccessPayload(data, message), status);
}
export function fail(request, status, message, data, extraHeaders) {
    return makeJsonResponse(request, buildErrorPayload(message, data), status, extraHeaders);
}
export function handleError(request, error) {
    const requestMeta = buildRequestLogMeta(request);

    if (error instanceof ValidationError) {
        logWarn("Request validation failed", {
            ...requestMeta,
            status: error.status,
            details: error.data,
        });
        return fail(request, error.status, error.message, error.data);
    }
    if (error instanceof ZodError) {
        const details = mapZodError(error);
        logWarn("Request schema validation failed", {
            ...requestMeta,
            status: 400,
            details,
        });
        return fail(request, 400, "Validation failed", details);
    }
    if (error instanceof AppError) {
        logWarn("Request failed", {
            ...requestMeta,
            status: error.status,
            details: error.data,
        });
        return fail(request, error.status, error.message, error.data, error.headers);
    }
    if (isMongooseCastError(error)) {
        logWarn("Invalid database identifier", {
            ...requestMeta,
            status: 400,
        });
        return fail(request, 400, "Invalid request parameters");
    }
    if (error instanceof SyntaxError) {
        logWarn("Invalid request syntax", {
            ...requestMeta,
            status: 400,
        });
        return fail(request, 400, "Invalid request body");
    }
    logError("Unexpected server error", error, {
        ...requestMeta,
        status: 500,
    });
    return fail(request, 500, "An unexpected error occurred");
}
export async function withErrorHandling(request, handler) {
    const startedAt = Date.now();

    try {
        const response = await handler();
        logInfo("Request completed", {
            ...buildRequestLogMeta(request),
            status: response.status,
            durationMs: Date.now() - startedAt,
        });
        return response;
    }
    catch (error) {
        const response = handleError(request, error);
        logInfo("Request completed", {
            ...buildRequestLogMeta(request),
            status: response.status,
            durationMs: Date.now() - startedAt,
        });
        return response;
    }
}
