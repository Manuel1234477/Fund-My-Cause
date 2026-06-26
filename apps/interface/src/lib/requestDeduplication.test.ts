import {
  deduplicatedFetch,
  invalidateCache,
  clearDeduplicationCache,
  getDeduplicationStats,
} from "./requestDeduplication";

describe("requestDeduplication", () => {
  beforeEach(() => {
    clearDeduplicationCache();
    jest.clearAllMocks();
  });

  it("should deduplicate concurrent requests", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ data: "test" }),
    });
    global.fetch = mockFetch as any;

    const promise1 = deduplicatedFetch("api/test", { id: 1 });
    const promise2 = deduplicatedFetch("api/test", { id: 1 });

    const [result1, result2] = await Promise.all([promise1, promise2]);

    expect(result1).toEqual({ data: "test" });
    expect(result2).toEqual({ data: "test" });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("should return cached results", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ data: "cached" }),
    });
    global.fetch = mockFetch as any;

    await deduplicatedFetch("api/test", { id: 2 });
    const result = await deduplicatedFetch("api/test", { id: 2 });

    expect(result).toEqual({ data: "cached" });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("should invalidate cache", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ data: "test" }),
    });
    global.fetch = mockFetch as any;

    await deduplicatedFetch("api/test", { id: 3 });
    invalidateCache("api/test", { id: 3 });
    await deduplicatedFetch("api/test", { id: 3 });

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("should track stats", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ data: "test" }),
    });
    global.fetch = mockFetch as any;

    await deduplicatedFetch("api/test", { id: 4 });
    const stats = getDeduplicationStats();

    expect(stats.cachedRequests).toBe(1);
    expect(stats.pendingRequests).toBe(0);
  });

  it("should clear all caches", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ data: "test" }),
    });
    global.fetch = mockFetch as any;

    await deduplicatedFetch("api/test", { id: 5 });
    clearDeduplicationCache();
    const stats = getDeduplicationStats();

    expect(stats.cachedRequests).toBe(0);
  });
});
