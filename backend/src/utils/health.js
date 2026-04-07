import mongoose from "mongoose";

import { connectToDatabase } from "@/utils/db";

function getRequiredEnvStatus() {
  const requiredVars = ["MONGODB_URI", "JWT_SECRET"];

  return requiredVars.map((name) => {
    const value = process.env[name];

    return {
      name,
      configured: typeof value === "string" && value.trim().length > 0,
    };
  });
}

export async function getHealthReport() {
  const startedAt = new Date(Date.now() - Math.round(process.uptime() * 1000)).toISOString();
  const env = getRequiredEnvStatus();
  const missingEnv = env.filter((item) => !item.configured).map((item) => item.name);

  const report = {
    status: "ok",
    service: "edulearn-backend",
    uptimeSeconds: Math.round(process.uptime()),
    startedAt,
    timestamp: new Date().toISOString(),
    checks: {
      app: {
        status: "ok",
      },
      env: {
        status: missingEnv.length === 0 ? "ok" : "error",
        missing: missingEnv,
      },
      database: {
        status: "unknown",
      },
    },
  };

  if (missingEnv.length > 0) {
    report.status = "error";
    return report;
  }

  try {
    await connectToDatabase();

    report.checks.database = {
      status: mongoose.connection.readyState === 1 ? "ok" : "error",
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host ?? null,
      name: mongoose.connection.name ?? process.env.MONGODB_DB ?? null,
    };
  } catch (error) {
    report.checks.database = {
      status: "error",
      message: error instanceof Error ? error.message : "Database connection failed",
    };
  }

  if (report.checks.database.status !== "ok") {
    report.status = "error";
  }

  return report;
}
