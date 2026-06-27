import { describe, it, expect } from "vitest";
import { EventStore, type IndexerEvent } from "./event-store";
import pino from "pino";

const logger = pino({ level: "silent" });

describe("EventStore", () => {
  it("should add and retrieve events", () => {
    const store = new EventStore(logger);
    const events: IndexerEvent[] = [
      {
        id: "1",
        timestamp: Date.now(),
        type: "Contribute",
        contractId: "CXXX",
        data: { amount: "1000" },
      },
    ];

    store.addEvents(events);
    expect(store.getCount()).toBe(1);
  });

  it("should query events by contract ID", () => {
    const store = new EventStore(logger);
    const events: IndexerEvent[] = [
      {
        id: "1",
        timestamp: Date.now(),
        type: "Contribute",
        contractId: "CXXX",
        data: { amount: "1000" },
      },
      {
        id: "2",
        timestamp: Date.now(),
        type: "Contribute",
        contractId: "CYYY",
        data: { amount: "2000" },
      },
    ];

    store.addEvents(events);
    const results = store.queryByContract("CXXX");
    expect(results).toHaveLength(1);
    expect(results[0].contractId).toBe("CXXX");
  });

  it("should query events by type", () => {
    const store = new EventStore(logger);
    const events: IndexerEvent[] = [
      {
        id: "1",
        timestamp: Date.now(),
        type: "Contribute",
        contractId: "CXXX",
        data: {},
      },
      {
        id: "2",
        timestamp: Date.now(),
        type: "Withdraw",
        contractId: "CXXX",
        data: {},
      },
    ];

    store.addEvents(events);
    const results = store.queryByType("Contribute");
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe("Contribute");
  });

  it("should enforce max size limit", () => {
    const store = new EventStore(logger, 5);
    const events: IndexerEvent[] = Array.from({ length: 10 }, (_, i) => ({
      id: `${i}`,
      timestamp: Date.now() + i,
      type: "Contribute",
      contractId: "CXXX",
      data: {},
    }));

    store.addEvents(events);
    expect(store.getCount()).toBeLessThanOrEqual(5);
  });

  it("should clear all events", () => {
    const store = new EventStore(logger);
    const events: IndexerEvent[] = [
      {
        id: "1",
        timestamp: Date.now(),
        type: "Contribute",
        contractId: "CXXX",
        data: {},
      },
    ];

    store.addEvents(events);
    expect(store.getCount()).toBe(1);

    store.clear();
    expect(store.getCount()).toBe(0);
  });
});
