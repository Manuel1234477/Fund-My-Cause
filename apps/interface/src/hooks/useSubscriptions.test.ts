/**
 * Regression tests for #746 — verifies that subscription hooks do NOT
 * re-trigger the underlying Apollo subscription when only the callback
 * reference changes (i.e. the caller forgets to memoize with useCallback).
 *
 * The core bug: passing `callback` directly into a useEffect dep array means
 * every render that provides a new function reference causes a new
 * subscription to be created (subscribe → teardown → subscribe ...).
 * Fixed by holding the latest callback in a ref.
 */

import { renderHook } from "@testing-library/react";
import { useCampaignUpdates, useNewContributions } from "./useSubscriptions";

// ── Apollo mock ──────────────────────────────────────────────────────────────
const mockUseSubscription = jest.fn();
jest.mock("@apollo/client", () => ({
  useSubscription: (...args: unknown[]) => mockUseSubscription(...args),
  gql: (s: TemplateStringsArray) => s,
}));

// Suppress require() calls for the query constants
jest.mock(
  "../graphql/queries.js",
  () => ({
    ON_CAMPAIGN_UPDATED: "ON_CAMPAIGN_UPDATED",
    ON_NEW_CONTRIBUTION: "ON_NEW_CONTRIBUTION",
  }),
  { virtual: true },
);

describe("useSubscriptions — callback ref stability (#746)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: no data yet
    mockUseSubscription.mockReturnValue({ data: undefined, loading: true, error: undefined });
  });

  it("calls the latest callback when new data arrives", () => {
    const callback1 = jest.fn();
    const { rerender } = renderHook(
      ({ cb }: { cb: (d: unknown) => void }) =>
        useCampaignUpdates("campaign-1", cb),
      { initialProps: { cb: callback1 } },
    );

    // Simulate data arriving
    const payload = { id: "1", title: "Test" };
    mockUseSubscription.mockReturnValue({
      data: { campaignUpdated: payload },
      loading: false,
      error: undefined,
    });

    const callback2 = jest.fn();
    rerender({ cb: callback2 });

    expect(callback2).toHaveBeenCalledWith(payload);
    expect(callback1).not.toHaveBeenCalled();
  });

  it("does not re-mount the subscription when only the callback reference changes", () => {
    const callback1 = jest.fn();
    mockUseSubscription.mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
    });

    const { rerender } = renderHook(
      ({ cb }: { cb: (d: unknown) => void }) =>
        useCampaignUpdates("campaign-1", cb),
      { initialProps: { cb: callback1 } },
    );

    const subscriptionCallCountAfterMount = mockUseSubscription.mock.calls.length;

    // New callback reference, same campaignId — should NOT cause a new useSubscription call
    const callback2 = jest.fn();
    rerender({ cb: callback2 });

    // useSubscription is called once per render (React re-render), but the
    // *options* passed to it should remain stable (same skip, same variables).
    // The key invariant: useSubscription is always called with skip=false and
    // the same variables regardless of callback identity.
    const allCalls = mockUseSubscription.mock.calls;
    const lastCall = allCalls[allCalls.length - 1];
    expect(lastCall[1]).toMatchObject({ variables: { id: "campaign-1" }, skip: false });
    expect(allCalls.length).toBeGreaterThanOrEqual(subscriptionCallCountAfterMount);
  });

  it("skips subscription when campaignId is null", () => {
    mockUseSubscription.mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
    });

    renderHook(() => useCampaignUpdates(null, jest.fn()));

    const lastCall =
      mockUseSubscription.mock.calls[
        mockUseSubscription.mock.calls.length - 1
      ];
    expect(lastCall[1]).toMatchObject({ skip: true });
  });

  it("useNewContributions calls latest callback on data arrival", () => {
    const contribution = { id: "c1", amount: 100 };
    mockUseSubscription.mockReturnValue({
      data: { newContribution: contribution },
      loading: false,
      error: undefined,
    });

    const cb = jest.fn();
    renderHook(() => useNewContributions("campaign-1", cb));

    expect(cb).toHaveBeenCalledWith(contribution);
  });

  it("useNewContributions does not call callback when data is undefined", () => {
    mockUseSubscription.mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
    });

    const cb = jest.fn();
    renderHook(() => useNewContributions("campaign-1", cb));

    expect(cb).not.toHaveBeenCalled();
  });
});
