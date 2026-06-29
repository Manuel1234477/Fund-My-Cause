/** @jest-environment node */
import { Keypair } from "@stellar/stellar-sdk";
import {
  buildAuthMessage,
  verifyWalletSignature,
  validateAuthHeader,
} from "@/lib/walletAuth";

function makeHeader(keypair: Keypair, timestamp: number): string {
  const address = keypair.publicKey();
  const message = buildAuthMessage(address, timestamp);
  const sig = keypair.sign(Buffer.from(message)).toString("hex");
  return `Wallet ${address}:${timestamp}:${sig}`;
}

describe("validateAuthHeader", () => {
  it("returns null for missing header", () => {
    expect(validateAuthHeader(null)).toBeNull();
  });

  it("returns null for malformed header", () => {
    expect(validateAuthHeader("Bearer sometoken")).toBeNull();
    expect(validateAuthHeader("Wallet badformat")).toBeNull();
  });

  it("returns null for expired timestamp", () => {
    const kp = Keypair.random();
    const oldTimestamp = Date.now() - 6 * 60 * 1000; // 6 minutes ago
    const header = makeHeader(kp, oldTimestamp);
    expect(validateAuthHeader(header)).toBeNull();
  });

  it("returns parsed values for valid header", () => {
    const kp = Keypair.random();
    const timestamp = Date.now();
    const header = makeHeader(kp, timestamp);
    const result = validateAuthHeader(header);
    expect(result).not.toBeNull();
    expect(result?.address).toBe(kp.publicKey());
    expect(result?.timestamp).toBe(timestamp);
  });
});

describe("verifyWalletSignature", () => {
  it("verifies a valid signature", () => {
    const kp = Keypair.random();
    const message = "test-message";
    const sig = kp.sign(Buffer.from(message)).toString("hex");
    expect(verifyWalletSignature(kp.publicKey(), message, sig)).toBe(true);
  });

  it("rejects an invalid signature", () => {
    const kp = Keypair.random();
    const sig = kp.sign(Buffer.from("other-message")).toString("hex");
    expect(verifyWalletSignature(kp.publicKey(), "test-message", sig)).toBe(
      false,
    );
  });

  it("rejects a bad public key", () => {
    expect(verifyWalletSignature("not-a-key", "msg", "aabbcc")).toBe(false);
  });
});
