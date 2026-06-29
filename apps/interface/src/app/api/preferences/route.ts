import { NextRequest, NextResponse } from "next/server";
import { validateAuthHeader } from "@/lib/walletAuth";

const UNAUTHORIZED = NextResponse.json(
  { error: "Unauthorized" },
  { status: 401 },
);

function authenticate(request: NextRequest): string | null {
  const result = validateAuthHeader(request.headers.get("authorization"));
  return result ? result.address : null;
}

export async function GET(request: NextRequest) {
  const authAddress = authenticate(request);
  if (!authAddress) return UNAUTHORIZED;

  const address = request.nextUrl.searchParams.get("address");
  if (address && address !== authAddress) return UNAUTHORIZED;

  return NextResponse.json({ notifications: true, theme: "system" });
}

export async function POST(request: NextRequest) {
  const authAddress = authenticate(request);
  if (!authAddress) return UNAUTHORIZED;

  let body: { address?: string; [key: string]: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.address && body.address !== authAddress) return UNAUTHORIZED;

  return NextResponse.json({ success: true });
}
