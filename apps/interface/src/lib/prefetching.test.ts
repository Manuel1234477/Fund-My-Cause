import {
  prefetchData,
  getPrefetchedData,
  prefetchLink,
  addResourceHints,
  clearPrefetchCache,
  getPrefetchStats,
} from "./prefetching";

describe("prefetching", () => {
  beforeEach(() => {
    clearPrefetchCache();
    jest.clearAllMocks();
  });

  it("should prefetch data", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ data: "prefetched" }),
    });
    global.fetch = mockFetch as any;

    await prefetchData("api/test", { id: 1 });
    const data = getPrefetchedData("api/test", { id: 1 });

    expect(data).toEqual({ data: "prefetched" });
  });

  it("should not refetch prefetched data", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ data: "prefetched" }),
    });
    global.fetch = mockFetch as any;

    await prefetchData("api/test", { id: 2 });
    await prefetchData("api/test", { id: 2 });

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("should prefetch links", () => {
    const createElementSpy = jest.spyOn(document, "createElement");
    prefetchLink("https://example.com");

    expect(createElementSpy).toHaveBeenCalledWith("link");
  });

  it("should add resource hints", () => {
    const createElementSpy = jest.spyOn(document, "createElement");
    addResourceHints(["https://api.example.com"]);

    expect(createElementSpy).toHaveBeenCalledWith("link");
  });

  it("should track prefetch stats", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ data: "test" }),
    });
    global.fetch = mockFetch as any;

    await prefetchData("api/test", { id: 3 });
    prefetchLink("https://example.com");

    const stats = getPrefetchStats();
    expect(stats.prefetchedDataCount).toBe(1);
    expect(stats.prefetchedLinksCount).toBe(1);
  });

  it("should clear prefetch cache", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ data: "test" }),
    });
    global.fetch = mockFetch as any;

    await prefetchData("api/test", { id: 4 });
    clearPrefetchCache();

    const stats = getPrefetchStats();
    expect(stats.prefetchedDataCount).toBe(0);
  });
});
