import { computePledgeSuggestions } from "./pledgeSuggestions";

const S = 10_000_000n; // stroops per XLM

describe("computePledgeSuggestions", () => {
  const base = {
    goalStroops: 1000n * S,
    raisedStroops: 0n,
    minContributionStroops: 1n,
    maxContributionStroops: 0n,
  };

  it("returns common tiers and complete-goal suggestion", () => {
    const suggestions = computePledgeSuggestions(base);
    const amounts = suggestions.map((s) => s.amountStroops);
    expect(amounts).toContain(10n * S);
    expect(amounts).toContain(25n * S);
    expect(amounts).toContain(50n * S);
    expect(amounts).toContain(100n * S);
    // 1000 XLM complete-goal suggestion
    expect(amounts).toContain(1000n * S);
  });

  it("marks the complete-goal suggestion", () => {
    const suggestions = computePledgeSuggestions(base);
    const complete = suggestions.find((s) => s.completesGoal);
    expect(complete).toBeDefined();
    expect(complete?.amountStroops).toBe(1000n * S);
    expect(complete?.label).toMatch(/complete goal/i);
  });

  it("marks common tier as completesGoal when it would finish the campaign", () => {
    const suggestions = computePledgeSuggestions({
      ...base,
      goalStroops: 10n * S, // exactly one common tier away
      raisedStroops: 0n,
    });
    const tenXlm = suggestions.find((s) => s.amountStroops === 10n * S);
    expect(tenXlm?.completesGoal).toBe(true);
  });

  it("excludes amounts below minContribution", () => {
    const suggestions = computePledgeSuggestions({
      ...base,
      minContributionStroops: 30n * S, // rules out 10 and 25 XLM
    });
    const amounts = suggestions.map((s) => s.amountStroops);
    expect(amounts).not.toContain(10n * S);
    expect(amounts).not.toContain(25n * S);
    expect(amounts).toContain(50n * S);
  });

  it("respects per-contributor cap", () => {
    const suggestions = computePledgeSuggestions({
      ...base,
      maxContributionStroops: 20n * S, // cap at 20 XLM
    });
    const amounts = suggestions.map((s) => s.amountStroops);
    expect(amounts).not.toContain(25n * S);
    expect(amounts).not.toContain(50n * S);
    expect(amounts).not.toContain(100n * S);
    expect(amounts).toContain(10n * S);
  });

  it("accounts for existing contribution against cap", () => {
    const suggestions = computePledgeSuggestions({
      ...base,
      maxContributionStroops: 40n * S,
      existingContributionStroops: 20n * S, // only 20 XLM headroom left
    });
    const amounts = suggestions.map((s) => s.amountStroops);
    expect(amounts).not.toContain(25n * S);
    expect(amounts).toContain(10n * S);
  });

  it("falls back to min contribution when all tiers are below min", () => {
    const suggestions = computePledgeSuggestions({
      ...base,
      minContributionStroops: 200n * S, // above all common tiers and goal complete
      goalStroops: 200n * S,
      raisedStroops: 0n,
    });
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].amountStroops).toBe(200n * S);
  });

  it("returns sorted ascending by amount", () => {
    const suggestions = computePledgeSuggestions(base);
    for (let i = 1; i < suggestions.length; i++) {
      expect(suggestions[i].amountStroops).toBeGreaterThanOrEqual(
        suggestions[i - 1].amountStroops,
      );
    }
  });

  it("does not produce duplicate amounts", () => {
    const suggestions = computePledgeSuggestions({
      ...base,
      goalStroops: 10n * S, // 10 XLM matches both common tier and complete-goal
    });
    const amounts = suggestions.map((s) => s.amountStroops);
    const unique = new Set(amounts);
    expect(unique.size).toBe(amounts.length);
  });

  it("returns at most 5 suggestions", () => {
    const suggestions = computePledgeSuggestions(base);
    expect(suggestions.length).toBeLessThanOrEqual(5);
  });

  it("no completesGoal suggestions when goal is already met", () => {
    const suggestions = computePledgeSuggestions({
      ...base,
      raisedStroops: 1000n * S, // already at goal
    });
    expect(suggestions.every((s) => !s.completesGoal)).toBe(true);
  });
});
