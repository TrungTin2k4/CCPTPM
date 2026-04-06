import { randomUUID } from "crypto";

const LOG_LEVELS = {
    debug: "DEBUG",
    info: "INFO",
    warn: "WARN",
    error: "ERROR",
};
const requestIds = new WeakMap();

function getTimestamp() {
    return new Date().toISOString();
}

function normalizeMessage(message) {
    if (typeof message === "string" && message.trim().length > 0) {
        return message;
    }
    return "Application log";
}

function sanitizeMeta(meta) {
    if (!meta || typeof meta !== "object" || Array.isArray(meta)) {
        return undefined;
    }

    return Object.fromEntries(
        Object.entries(meta).filter(([, value]) => value !== undefined),
    );
}

function serializeError(error) {
    if (!(error instanceof Error)) {
        return undefined;
    }

    return {
        name: error.name,
        message: error.message,
        stack: error.stack,
    };
}

function writeLog(level, message, meta) {
    const payload = {
        timestamp: getTimestamp(),
        level: LOG_LEVELS[level],
        message: normalizeMessage(message),
    };

    const normalizedMeta = sanitizeMeta(meta);
    if (normalizedMeta) {
        payload.meta = normalizedMeta;
    }

    const output = JSON.stringify(payload);
    if (level === "error" || level === "warn") {
        console.error(output);
        return;
    }

    console.log(output);
}

export function getRequestId(request) {
    const cachedRequestId = requestIds.get(request);
    if (cachedRequestId) {
        return cachedRequestId;
    }

    const incomingRequestId = request.headers.get("x-request-id");
    if (incomingRequestId && incomingRequestId.trim().length > 0) {
        requestIds.set(request, incomingRequestId);
        return incomingRequestId;
    }

    const generatedRequestId = randomUUID();
    requestIds.set(request, generatedRequestId);
    return generatedRequestId;
}

export function buildRequestLogMeta(request, extraMeta) {
    return sanitizeMeta({
        requestId: getRequestId(request),
        method: request.method,
        path: request.nextUrl.pathname,
        query: request.nextUrl.search,
        ...extraMeta,
    });
}

export function logInfo(message, meta) {
    writeLog("info", message, meta);
}

export function logWarn(message, meta) {
    writeLog("warn", message, meta);
}

export function logError(message, error, meta) {
    writeLog("error", message, {
        ...meta,
        error: serializeError(error),
    });
}
