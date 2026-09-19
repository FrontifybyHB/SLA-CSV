import type { Express, Request, Response } from "express";

let cachedApp: Express | undefined;

async function getApp(): Promise<Express> {
  if (!cachedApp) {
    // Lazy import so a missing env var fails per-request with a clear JSON
    // message instead of crashing module load (FUNCTION_INVOCATION_FAILED).
    const { createApp } = await import("../src/app.js");
    cachedApp = createApp();
  }
  return cachedApp;
}

type ExpressHandler = (req: Request, res: Response) => void;

export default async function handler(req: Request, res: Response): Promise<void> {
  let app: Express;
  try {
    app = await getApp();
  } catch (err) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Server misconfigured",
      data: {
        error: err instanceof Error ? err.message : String(err),
        hint: "Set DATABASE_URL, ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET and REFRESH_TOKEN_PEPPER in Vercel Project Settings → Environment Variables, then redeploy.",
      },
    });
    return;
  }
  (app as unknown as ExpressHandler)(req, res);
}
