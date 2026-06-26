/**
 * Contribution amount suggestion engine for the pledge flow.
 *
 * Computes a small set of sensible tiers based on:
 * - Common round-number tiers (10 / 25 / 50 / 100 XLM)
 * - A "complete the goal" amount that would push the campaign over the finish line
 * - The campaign's min_contribution and per-contributor cap constraints
 */

/** Common XLM tier amounts in stroops (1 XLM = 10_000_000 stroops). */
const STROOPS_PER_XLM = 10_000_000n;

const COMMON_TIERS_XLM = [10n, 25n, 50n, 100n] as const;

export interface PledgeSuggestion {
  /** Amount in stroops */
  amountStroops: bigint;
  /** Display label */
  label: string;
  /**
   * True when this amount would push the total raised >= the goal.
   * Used to visually highlight the "complete the goal" suggestion.
   */
  completesGoal: boolean;
}

export interface SuggestionInput {
  /** Goal in stroops */
  goalStroops: bigint;
  /** Amount already raised in stroops */
  raisedStroops: bigint;
  /** Minimum contribution in stroops (inclusive). */
  minContributionStroops: bigint;
  /** Per-contributor cap in stroops (0 means no cap). */
  maxContributionStroops: bigint;
  /** How much the current contributor has already pledged (for cap checking). */
  existingContributionStroops?: bigint;
}

function xlmToStroops(xlm: bigint): bigint {
  return xlm * STROOPS_PER_XLM;
}

function stroopsToXlm(stroops: bigint): string {
  const whole = stroops / STROOPS_PER_XLM;
  const frac = stroops % STROOPS_PER_XLM;
  if (frac === 0n) return `${whole} XLM`;
  // Show up to 2 decimal places
  const fracStr = frac.toString().padStart(7, "0").slice(0, 2).replace(/0+$/, "");
  return fracStr ? `${whole}.${fracStr} XLM` : `${whole} XLM`;
}

/**
 * Returns up to 5 pledge suggestions, de-duped and sorted ascending.
 * Always includes at least one entry ≥ minContributionStroops.
 */
export function computePledgeSuggestions(input: SuggestionInput): PledgeSuggestion[] {
  const {
    goalStroops,
    raisedStroops,
    minContributionStroops,
    maxContributionStroops,
    existingContributionStroops = 0n,
  } = input;

  const remaining = goalStroops > raisedStroops ? goalStroops - raisedStroops : 0n;

  // Effective ceiling for this contributor
  const effectiveCap =
    maxContributionStroops > 0n
      ? maxContributionStroops - existingContributionStroops
      : 0n; // 0 means unlimited

  const isValid = (amount: bigint): boolean => {
    if (amount < minContributionStroops) return false;
    if (effectiveCap > 0n && amount > effectiveCap) return false;
    return true;
  };

  const seen = new Set<bigint>();
  const suggestions: PledgeSuggestion[] = [];

  const add = (amount: bigint, label: string, completesGoal: boolean) => {
    if (!isValid(amount)) return;
    if (seen.has(amount)) return;
    seen.add(amount);
    suggestions.push({ amountStroops: amount, label, completesGoal });
  };

  // 1. Common XLM tiers
  for (const xlm of COMMON_TIERS_XLM) {
    add(xlmToStroops(xlm), `${xlm} XLM`, remaining > 0n && xlmToStroops(xlm) >= remaining);
  }

  // 2. "Complete the goal" tier — only when meaningful
  if (remaining > 0n) {
    const completesLabel = `${stroopsToXlm(remaining)} (complete goal)`;
    add(remaining, completesLabel, true);
  }

  // 3. If nothing is valid (e.g. min > 100 XLM), add the minimum itself
  if (suggestions.length === 0 && isValid(minContributionStroops)) {
    add(minContributionStroops, `${stroopsToXlm(minContributionStroops)} (min)`, false);
  }

  // Sort ascending and cap at 5 items
  suggestions.sort((a, b) => (a.amountStroops < b.amountStroops ? -1 : 1));
  return suggestions.slice(0, 5);
}
