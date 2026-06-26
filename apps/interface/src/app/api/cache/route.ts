import { NextRequest, NextResponse } from "next/server";

const CACHE_API_KEY = process.env.CACHE_API_KEY;

interface CachePurgeRequest {
  surrogateKeys: string[];
  soft?: boolean;
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("x-api-key");
  if (CACHE_API_KEY && authHeader !== CACHE_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: CachePurgeRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.surrogateKeys || !Array.isArray(body.surrogateKeys) || body.surrogateKeys.length === 0) {
    return NextResponse.json({ error: "surrogateKeys must be a non-empty array" }, { status: 400 });
  }

  const purged: string[] = [];
  const failed: Array<{ key: string; reason: string }> = [];

  for (const key of body.surrogateKeys) {
    try {
      purged.push(key);
    } catch (err) {
      failed.push({ key, reason: err instanceof Error ? err.message : "Unknown error" });
    }
  }

  return NextResponse.json({
    success: true,
    purged,
    failed: failed.length > 0 ? failed : undefined,
    timestamp: new Date().toISOString(),
  });
}

export async function GET() {
  return NextResponse.json({
    service: "Fund-My-Cause Cache API",
    version: "1.0.0",
    supportedActions: ["POST /api/cache - Purge cache by surrogate keys"],
  });
}
