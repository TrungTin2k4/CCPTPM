import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { buildCorsHeaders } from "@/utils/cors";
import { AppError, ValidationError } from "@/utils/errors";

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

function mapMongooseValidationError(error) {
    const fieldErrors = {};
    for (const [field, issue] of Object.entries(error.errors)) {
        if (issue && typeof issue === "object" && "message" in issue && typeof issue.message === "string") {
            fieldErrors[field] = issue.message;
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

function isMongooseValidationError(error) {
    return Boolean(error &&
        typeof error === "object" &&
        "name" in error &&
        "errors" in error &&
        error.name === "ValidationError");
}

function isMongoDuplicateKeyError(error) {
    return Boolean(error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === 11000);
}

function getDuplicateKeyErrorData(error) {
    if (!(error && typeof error === "object" && "keyPattern" in error && error.keyPattern && typeof error.keyPattern === "object")) {
        return undefined;
    }
    const [field] = Object.keys(error.keyPattern);
    if (!field) {
        return undefined;
    }
    return {
        [field]: `${field} already exists`,
    };
}

function logUnexpectedServerError(request, error) {
    console.error("Unexpected server error", {
        method: request.method,
        path: request.nextUrl.pathname,
        search: request.nextUrl.search,
        error,
    });
}

function makeJsonResponse(request, payload, status, extraHeaders) {
    const headers = buildCorsHeaders(request);
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
    if (error instanceof ValidationError) {
        return fail(request, error.status, error.message, error.data);
    }
    if (error instanceof ZodError) {
        return fail(request, 400, "Validation failed", mapZodError(error));
    }
    if (error instanceof AppError) {
        return fail(request, error.status, error.message, error.data, error.headers);
    }
    if (isMongooseValidationError(error)) {
        return fail(request, 400, "Validation failed", mapMongooseValidationError(error));
    }
    if (isMongoDuplicateKeyError(error)) {
        return fail(request, 409, "Resource already exists", getDuplicateKeyErrorData(error));
    }
    if (isMongooseCastError(error)) {
        return fail(request, 400, "Invalid request parameters");
    }
    if (error instanceof SyntaxError) {
        return fail(request, 400, "Invalid request body");
    }
    logUnexpectedServerError(request, error);
    return fail(request, 500, "An unexpected error occurred");
}
export async function withErrorHandling(request, handler) {
    try {
        return await handler();
    }
    catch (error) {
        return handleError(request, error);
    }
}
