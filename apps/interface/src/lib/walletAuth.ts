import { Keypair } from "@stellar/stellar-sdk";

const AUTH_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

export function buildAuthMessage(address: string, timestamp: number): string {
  return `fund-my-cause:auth:${address}:${timestamp}`;
}

export function verifyWalletSignature(
  address: string,
  message: string,
  signature: string,
): boolean {
  try {
    const keypair = Keypair.fromPublicKey(address);
    const sigBuffer = Buffer.from(signature, "hex");
    return keypair.verify(Buffer.from(message), sigBuffer);
  } catch {
    return false;
  }
}

/** Header format: `Wallet <address>:<timestamp>:<signature_hex>` */
export function validateAuthHeader(
  authHeader: string | null,
): { address: string; timestamp: number } | null {
  if (!authHeader) return null;

  const match = authHeader.match(/^Wallet (.+):(\d+):([0-9a-fA-F]+)$/);
  if (!match) return null;

  const [, address, tsStr, signature] = match;
  const timestamp = Number(tsStr);

  if (Date.now() - timestamp > AUTH_WINDOW_MS) return null;

  const message = buildAuthMessage(address, timestamp);
  if (!verifyWalletSignature(address, message, signature)) return null;

  return { address, timestamp };
}
