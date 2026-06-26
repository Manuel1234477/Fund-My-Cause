import { clearChaos, injectChaos, withChaos, getActiveFailure } from "@/lib/chaos";

beforeEach(() => {
  clearChaos();
});

describe("chaos injection framework", () => {
  it("injects a latency failure", async () => {
    injectChaos("rpc", { probability: 1, latencyMs: 50, errorMessage: "timeout" });

    const start = Date.now();
    await expect(
      withChaos("rpc", async () => "ok"),
    ).rejects.toThrow("timeout");
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(45);
  });

  it("passes through when probability is 0", async () => {
    injectChaos("rpc", { probability: 0, errorMessage: "should not happen" });

    const result = await withChaos("rpc", async () => "ok");
    expect(result).toBe("ok");
  });

  it("passes through for different target", async () => {
    injectChaos("rpc", { probability: 1, errorMessage: "rpc fail" });

    const result = await withChaos("search", async () => "ok");
    expect(result).toBe("ok");
  });

  it("clears injected failure", async () => {
    injectChaos("rpc", { probability: 1, errorMessage: "fail" });
    clearChaos();

    const result = await withChaos("rpc", async () => "ok");
    expect(result).toBe("ok");
  });

  it("tracks failure count", async () => {
    injectChaos("rpc", { probability: 1, errorMessage: "fail" });

    try {
      await withChaos("rpc", async () => "ok");
    } catch { /* expected */ }
    try {
      await withChaos("rpc", async () => "ok");
    } catch { /* expected */ }

    const { getFailureCount, resetFailureCount } = await import("@/lib/chaos");
    expect(getFailureCount()).toBeGreaterThan(0);
    resetFailureCount();
  });
});

describe("resilience patterns", () => {
  it("falls back to cached data on RPC failure", async () => {
    injectChaos("rpc", { probability: 1, errorMessage: "RPC unreachable" });

    let usedCache = false;
    let cacheHit = false;

    const result = await withChaos("rpc", async () => {
      throw new Error("RPC unreachable");
    }).catch(() => {
      usedCache = true;
      cacheHit = true;
      return { info: null, stats: null, fromCache: true };
    });

    expect(usedCache).toBe(true);
    expect(result).toEqual({ info: null, stats: null, fromCache: true });
  });

  it("recovers once RPC comes back", async () => {
    let callCount = 0;

    const fetchWithRecovery = async () => {
      callCount++;
      if (callCount <= 2) {
        injectChaos("rpc", { probability: 1, errorMessage: "transient error" });
      } else {
        clearChaos();
      }
      return withChaos("rpc", async () => ({ ok: true }));
    };

    await expect(fetchWithRecovery()).rejects.toThrow();
    await expect(fetchWithRecovery()).rejects.toThrow();

    const result = await fetchWithRecovery();
    expect(result).toEqual({ ok: true });
    expect(callCount).toBe(3);
  });

  it("does not crash on concurrent failures", async () => {
    injectChaos("rpc", { probability: 1, errorMessage: "burst fail" });

    const tasks = Array.from({ length: 10 }, (_, i) =>
      withChaos("rpc", async () => i).catch(() => "degraded"),
    );

    const results = await Promise.all(tasks);
    expect(results.every((r) => r === "degraded")).toBe(true);
  });

  it("handles slow responses without blocking others", async () => {
    injectChaos("rpc", { probability: 1, latencyMs: 100, errorMessage: "slow" });

    const start = Date.now();
    const tasks = Array.from({ length: 5 }, () =>
      withChaos("rpc", async () => "fast enough"),
    );

    const results = await Promise.allSettled(tasks);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(90);
    expect(elapsed).toBeLessThan(300);
    expect(results.every((r) => r.status === "rejected")).toBe(true);
  });
});
