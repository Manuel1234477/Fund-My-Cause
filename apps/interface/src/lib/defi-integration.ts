/**
 * DeFi integration helpers: multi-token support, yield generation, and
 * Stellar DEX price lookups for the Fund-My-Cause platform.
 *
 * These helpers sit on top of the contract.ts layer and provide higher-level
 * abstractions used by the UI (TokenSelector, PledgeModal, YieldPanel).
 */

import {
  Horizon,
  Asset,
} from "@stellar/stellar-sdk";
import { HORIZON_URL } from "@/lib/constants";
import {
  getAcceptedTokens,
  getYieldConfig,
  getPendingYield,
  claimYield,
  configureYield,
  contribute,
} from "@/lib/contract";
import type { SignFn } from "@/types/contract";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TokenInfo {
  /** Stellar contract address (C…) or "native" for XLM */
  address: string;
  /** Token ticker symbol, e.g. "XLM", "USDC" */
  symbol: string;
  /** Display name */
  name: string;
  /** Number of decimal places */
  decimals: number;
}

export interface YieldSummary {
  /** Reward token info */
  rewardToken: string;
  /** Total pool size in reward token units */
  pool: bigint;
  /** Annual yield rate as a percentage (e.g. 5.0 for 5%) */
  ratePercent: number;
  /** Pending yield claimable by the connected contributor */
  pending: bigint;
}

export interface SlippageQuote {
  /** Amount the contributor sends */
  sendAmount: bigint;
  /** Estimated amount received after DEX conversion */
  receiveAmount: bigint;
  /** Slippage percentage (0–100) */
  slippagePct: number;
  /** Path of asset codes used in the conversion */
  path: string[];
}

// ── Well-known tokens on Stellar ─────────────────────────────────────────────

/** Curated list of commonly accepted Stellar tokens shown in the selector. */
export const KNOWN_TOKENS: TokenInfo[] = [
  {
    address: "native",
    symbol: "XLM",
    name: "Stellar Lumens",
    decimals: 7,
  },
  {
    address: "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 7,
  },
  {
    address: "CDLQBK2DFENR7ZKBIVN5BCGCJCJW5XKEIZIOOVHJDKKQG2LN5OQSHC4X",
    symbol: "EURC",
    name: "Euro Coin",
    decimals: 7,
  },
];

// ── Accepted-token helpers ────────────────────────────────────────────────────

/**
 * Resolves the accepted tokens for a campaign and enriches them with
 * display metadata from the KNOWN_TOKENS list.
 *
 * Unknown tokens are returned with the address as the symbol/name.
 */
export async function getCampaignTokens(
  contractId: string,
): Promise<TokenInfo[]> {
  const addresses = await getAcceptedTokens(contractId);
  return addresses.map((addr) => {
    const known = KNOWN_TOKENS.find(
      (t) => t.address.toLowerCase() === addr.toLowerCase(),
    );
    return known ?? { address: addr, symbol: addr.slice(0, 6), name: addr, decimals: 7 };
  });
}

// ── Contribution with token selection ────────────────────────────────────────

/**
 * Submits a contribution in the specified token.
 * Wraps `contribute` from contract.ts with an explicit token and optional message.
 */
export async function contributeWithToken(
  contractId: string,
  contributor: string,
  amount: bigint,
  tokenAddress: string,
  signTx: SignFn,
  message?: string,
): Promise<string> {
  return contribute(contractId, contributor, amount, signTx, tokenAddress, message);
}

// ── Yield helpers ─────────────────────────────────────────────────────────────

/**
 * Fetches the yield summary for a campaign and a given contributor.
 * Returns null if yield is not configured.
 */
export async function getYieldSummary(
  contractId: string,
  contributor?: string,
): Promise<YieldSummary | null> {
  const config = await getYieldConfig(contractId);
  if (!config) return null;

  const pending =
    contributor != null
      ? await getPendingYield(contractId, contributor)
      : 0n;

  return {
    rewardToken: config.rewardToken,
    pool: config.pool,
    ratePercent: config.rateBps / 100,
    pending,
  };
}

export { claimYield, configureYield };

// ── Stellar DEX price/slippage helpers ────────────────────────────────────────

/**
 * Fetches a slippage quote using Horizon's path payment strict-send endpoint.
 * Used to show contributors the estimated conversion rate when contributing
 * in a non-primary token (e.g. USDC → XLM).
 *
 * @param sendAsset - Stellar Asset the contributor is sending
 * @param receiveAsset - Stellar Asset the campaign expects
 * @param sendAmount - Amount to send, in the send asset's stroops
 * @param maxSlippagePct - Reject the quote if slippage exceeds this (0–100)
 */
export async function getDexQuote(
  sendAsset: Asset,
  receiveAsset: Asset,
  sendAmount: bigint,
  maxSlippagePct = 1,
): Promise<SlippageQuote> {
  const horizon = new Horizon.Server(HORIZON_URL);

  const sendAmountXdr = (Number(sendAmount) / 10_000_000).toFixed(7);

  const paths = await horizon
    .strictSendPaths(sendAsset, sendAmountXdr, [receiveAsset])
    .call();

  if (!paths.records.length) {
    throw new Error("No DEX path found between these tokens");
  }

  const best = paths.records[0];
  const receiveAmount = BigInt(
    Math.round(parseFloat(best.destination_amount) * 10_000_000),
  );

  // Simple slippage estimate: compare against a 1:1 fiat-equivalent baseline
  // using the first path. In production, compare against an oracle price.
  const directRate = Number(receiveAmount) / Number(sendAmount);
  // Assume 1:1 parity as baseline (replace with oracle if available)
  const slippagePct = Math.max(0, (1 - directRate) * 100);

  if (slippagePct > maxSlippagePct) {
    throw new Error(
      `Slippage ${slippagePct.toFixed(2)}% exceeds maximum ${maxSlippagePct}%`,
    );
  }

  const path: string[] = best.path.map(
    (a: { asset_type: string; asset_code?: string }) =>
      a.asset_type === "native" ? "XLM" : (a.asset_code ?? "?"),
  );

  return { sendAmount, receiveAmount, slippagePct, path };
}
