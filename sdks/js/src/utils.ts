/** 1 XLM expressed in stroops */
export const STROOPS_PER_XLM = 10_000_000n;

/** Convert an XLM float to stroops (bigint). Rounds to the nearest stroop. */
export function xlmToStroops(xlm: number): bigint {
  return BigInt(Math.round(xlm * 1e7));
}

/** Convert stroops (bigint) to an XLM float. */
export function stroopsToXlm(stroops: bigint): number {
  return Number(stroops) / 1e7;
}

/** Convert basis points to a human-readable percentage string, e.g. 5000 → "50%" */
export function bpsToPercent(bps: number): string {
  return (bps / 100).toFixed(bps % 100 === 0 ? 0 : 2) + "%";
}

/** Convert a Unix timestamp (seconds) to a JS Date. */
export function unixToDate(ts: bigint | number): Date {
  return new Date(Number(ts) * 1000);
}

/** Days remaining until a deadline (floored, minimum 0). */
export function daysUntil(deadline: Date): number {
  return Math.max(0, Math.floor((deadline.getTime() - Date.now()) / 86_400_000));
}
