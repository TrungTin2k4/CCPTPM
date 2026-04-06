import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { buildCorsHeaders, corsPreflight } from "@/utils/cors";
import { NotFoundError } from "@/utils/errors";
import { withErrorHandling } from "@/utils/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIME_TYPES = new Map([
    ["jpg", "image/jpeg"],
    ["jpeg", "image/jpeg"],
    ["png", "image/png"],
    ["webp", "image/webp"],
    ["gif", "image/gif"],
    ["svg", "image/svg+xml"],
]);

const ALLOWED_METHODS = "GET, OPTIONS";

export async function OPTIONS(request) {
    return corsPreflight(request, ALLOWED_METHODS);
}

export async function GET(request, context) {
    return withErrorHandling(request, async () => {
        const { path: segments } = await context.params;
        if (!segments || segments.length === 0) {
            throw new NotFoundError("File not found");
        }

        const relativePath = segments.join("/");

        // Security: block directory traversal
        if (relativePath.includes("..")) {
            throw new NotFoundError("File not found");
        }

        const ext = path.extname(relativePath).replace(".", "").toLowerCase();
        const mimeType = MIME_TYPES.get(ext);
        if (!mimeType) {
            throw new NotFoundError("File not found");
        }

        const absolutePath = path.join(process.cwd(), "public", "uploads", ...segments);

        try {
            const fileBuffer = await readFile(absolutePath);
            const headers = buildCorsHeaders(request, ALLOWED_METHODS);
            headers.set("Content-Type", mimeType);
            headers.set("Cache-Control", "public, max-age=31536000, immutable");

            return new NextResponse(fileBuffer, {
                status: 200,
                headers,
            });
        }
        catch (error) {
            if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
                throw new NotFoundError("File not found");
            }
            throw error;
        }
    });
}
