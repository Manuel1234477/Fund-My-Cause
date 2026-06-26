import {
  startMemoryProfiling,
  stopMemoryProfiling,
  trackAllocation,
  getMemoryStats,
  detectMemoryLeaks,
  clearAllocationTracking,
  getAllocationReport,
  createMemoryLeakDetector,
} from "./memoryLeakDetection";

describe("memoryLeakDetection", () => {
  beforeEach(() => {
    clearAllocationTracking();
    stopMemoryProfiling();
  });

  it("should start and stop memory profiling", () => {
    startMemoryProfiling();
    expect(() => startMemoryProfiling()).not.toThrow();
    stopMemoryProfiling();
  });

  it("should track allocations", () => {
    startMemoryProfiling();
    trackAllocation("Component", 1024);
    trackAllocation("Component", 2048);

    const stats = getMemoryStats();
    expect(stats.allocationsByType["Component"]).toBe(2);
    expect(stats.totalAllocations).toBe(2);
  });

  it("should calculate memory stats", () => {
    startMemoryProfiling();
    trackAllocation("Type1", 100);
    trackAllocation("Type2", 200);

    const stats = getMemoryStats();
    expect(stats.totalAllocations).toBe(2);
    expect(stats.totalSize).toBe(300);
  });

  it("should detect potential memory leaks", () => {
    startMemoryProfiling();

    for (let i = 0; i < 1001; i++) {
      trackAllocation("LeakyComponent", 10);
    }

    const { potentialLeaks } = detectMemoryLeaks();
    expect(potentialLeaks.length).toBeGreaterThan(0);
  });

  it("should generate allocation report", () => {
    startMemoryProfiling();
    trackAllocation("Component", 100);
    trackAllocation("Component", 200);

    const report = getAllocationReport();
    expect(report["Component"]).toBeDefined();
    expect((report["Component"] as any).count).toBe(2);
  });

  it("should create memory leak detector", () => {
    startMemoryProfiling();
    const detector = createMemoryLeakDetector("TestComponent");

    detector.onMount();
    detector.onSubscribe();
    detector.onUnsubscribe();
    detector.onUnmount();

    const stats = getMemoryStats();
    expect(stats.totalAllocations).toBe(4);
  });

  it("should clear allocation tracking", () => {
    startMemoryProfiling();
    trackAllocation("Component", 100);
    clearAllocationTracking();

    const stats = getMemoryStats();
    expect(stats.totalAllocations).toBe(0);
  });
});
