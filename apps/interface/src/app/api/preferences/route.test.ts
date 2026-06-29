/** @jest-environment node */
import { NextRequest } from "next/server";
import { Keypair } from "@stellar/stellar-sdk";
import { buildAuthMessage } from "@/lib/walletAuth";
import { GET, POST } from "@/app/api/preferences/route";

function makeAuthHeader(keypair: Keypair): string {
  const address = keypair.publicKey();
  const timestamp = Date.now();
  const message = buildAuthMessage(address, timestamp);
  const sig = keypair.sign(Buffer.from(message)).toString("hex");
  return `Wallet ${address}:${timestamp}:${sig}`;
}

function makeRequest(
  method: string,
  headers: Record<string, string> = {},
  body?: unknown,
): NextRequest {
  return new NextRequest("http://localhost/api/preferences", {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

describe("GET /api/preferences", () => {
  it("returns 401 without auth", async () => {
    const res = await GET(makeRequest("GET"));
    expect(res.status).toBe(401);
  });

  it("returns 401 with invalid auth", async () => {
    const res = await GET(
      makeRequest("GET", { authorization: "Wallet bad:0:nope" }),
    );
    expect(res.status).toBe(401);
  });

  it("returns preferences with valid auth", async () => {
    const kp = Keypair.random();
    const res = await GET(
      makeRequest("GET", { authorization: makeAuthHeader(kp) }),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toMatchObject({ notifications: true, theme: "system" });
  });
});

describe("POST /api/preferences", () => {
  it("returns 401 without auth", async () => {
    const res = await POST(makeRequest("POST", {}, {}));
    expect(res.status).toBe(401);
  });
});
