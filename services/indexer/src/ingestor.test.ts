/**
 * Issue #725 – Integration tests for the indexer ingestion pipeline
 *
 * Tests the ingestEvents() function by mocking the pg database client.
 * Covers: fixture → DB rows, idempotency on replay, reorg edge cases,
 * rollback on error, sync_state tracking.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { ingestEvents } from "./ingestor.js";

// ── DB mock ──────────────────────────────────────────────────────────────────
// We maintain a shared mock state that each test configures via helpers.

let _queryMock = vi.fn();
const _pool = {
  connect: vi.fn(async () => ({ query: _queryMock, release: vi.fn() })),
  query:   vi.fn(async () => ({ rows: [] })),
};

vi.mock("./db/index.js", () => ({ getPool: () => _pool }));

// Silence logger output in tests
vi.mock("./logger.js", () => ({
  createLogger: () => ({
    info:  vi.fn(),
    debug: vi.fn(),
    warn:  vi.fn(),
    error: vi.fn(),
  }),
}));

// ── Fixtures ─────────────────────────────────────────────────────────────────

const CONTRACT  = "CTEST0000000000000000000000000000000000000000000TEST";
const TX_INIT   = "tx_init_aaa";
const TX_C1     = "tx_contrib_bbb";
const TX_C2     = "tx_contrib_ccc";
const TX_DRAW   = "tx_withdraw_ddd";
const TX_REFUND = "tx_refund_eee";

const EVT_INIT = {
  type: "initialize" as const,
  contractId: CONTRACT,
  ledgerSequence: 100,
  txHash: TX_INIT,
  data: {
    creator: "GCREATOR00000000000000000000000001",
    tokenId: "GTOKEN000000000000000000000000001",
    goal: 10_000,
    deadline: 9_999_999,
    minContribution: 100,
    title: "Test Campaign",
    description: "Pipeline integration test",
  },
};

const EVT_C1 = {
  type: "contribute" as const,
  contractId: CONTRACT,
  ledgerSequence: 110,
  txHash: TX_C1,
  data: { contributor: "GADDR1000000001", amount: 1_000, tokenAmount: 1_000 },
};

const EVT_C2 = {
  type: "contribute" as const,
  contractId: CONTRACT,
  ledgerSequence: 120,
  txHash: TX_C2,
  data: { contributor: "GADDR2000000002", amount: 500, tokenAmount: 500 },
};

const EVT_WITHDRAW = {
  type: "withdraw" as const,
  contractId: CONTRACT,
  ledgerSequence: 200,
  txHash: TX_DRAW,
  data: {},
};

const EVT_REFUND = {
  type: "refund" as const,
  contractId: CONTRACT,
  ledgerSequence: 210,
  txHash: TX_REFUND,
  data: { contributor: "GADDR1000000001", amount: 1_000 },
};

// ── Mock setup helpers ────────────────────────────────────────────────────────

/**
 * Build a query mock that:
 * - Returns empty rows for new events (not yet processed)
 * - Returns a hit for events in `alreadyProcessed` set
 * - Tracks the campaign id produced by INSERT campaigns
 */
function makeQueryMock(alreadyProcessed: Set<string> = new Set()) {
  let campaignId: string | null = null;
  const calls: Array<{ sql: string; params: unknown[] }> = [];

  const mock = vi.fn(async (sql: string, params?: unknown[]) => {
    const p = params ?? [];
    calls.push({ sql: sql.trim(), params: p });
    const low = sql.toLowerCase();

    if (low.includes("select id from raw_events")) {
      const key = `${p[0]}::${p[1]}`;
      return alreadyProcessed.has(key) ? { rows: [{ id: "dup-id" }] } : { rows: [] };
    }
    if (low.includes("insert into campaigns")) {
      campaignId = (p as string[])[0];
      return { rows: [] };
    }
    if (low.includes("select id from campaigns")) {
      return campaignId ? { rows: [{ id: campaignId }] } : { rows: [] };
    }
    return { rows: [] };
  });

  return { mock, calls };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Indexer ingestion pipeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _pool.connect.mockImplementation(async () => ({
      query: _queryMock,
      release: vi.fn(),
    }));
  });

  it("inserts a campaign row for an initialize event", async () => {
    const { mock, calls } = makeQueryMock();
    _queryMock = mock;
    _pool.connect.mockImplementation(async () => ({ query: mock, release: vi.fn() }));

    await ingestEvents([EVT_INIT]);

    expect(calls.some((c) => c.sql === "BEGIN")).toBe(true);
    expect(
      calls.some(
        (c) =>
          c.sql.toLowerCase().includes("insert into campaigns") &&
          (c.params as string[]).includes(CONTRACT)
      )
    ).toBe(true);
    expect(calls.some((c) => c.sql.toLowerCase().includes("insert into raw_events"))).toBe(true);
    expect(calls.some((c) => c.sql === "COMMIT")).toBe(true);
  });

  it("inserts a contribution row and updates total_raised", async () => {
    const { mock, calls } = makeQueryMock();
    _pool.connect.mockImplementation(async () => ({ query: mock, release: vi.fn() }));

    await ingestEvents([EVT_INIT, EVT_C1]);

    expect(calls.some((c) => c.sql.toLowerCase().includes("insert into contributions"))).toBe(true);
    expect(
      calls.some(
        (c) =>
          c.sql.toLowerCase().includes("update campaigns") &&
          c.sql.toLowerCase().includes("total_raised")
      )
    ).toBe(true);
  });

  it("sets campaign status to succeeded on withdraw", async () => {
    const { mock, calls } = makeQueryMock();
    _pool.connect.mockImplementation(async () => ({ query: mock, release: vi.fn() }));

    await ingestEvents([EVT_INIT, EVT_WITHDRAW]);

    expect(
      calls.some(
        (c) =>
          c.sql.toLowerCase().includes("update campaigns") &&
          (c.params as unknown[]).includes("succeeded")
      )
    ).toBe(true);
  });

  it("inserts a refund row for a refund event", async () => {
    const { mock, calls } = makeQueryMock();
    _pool.connect.mockImplementation(async () => ({ query: mock, release: vi.fn() }));

    await ingestEvents([EVT_INIT, EVT_REFUND]);

    expect(calls.some((c) => c.sql.toLowerCase().includes("insert into refunds"))).toBe(true);
  });

  it("skips already-processed events on replay (idempotency)", async () => {
    const already = new Set([`${TX_INIT}::initialize`, `${TX_C1}::contribute`]);
    const { mock, calls } = makeQueryMock(already);
    _pool.connect.mockImplementation(async () => ({ query: mock, release: vi.fn() }));

    await ingestEvents([EVT_INIT, EVT_C1]);

    expect(calls.filter((c) => c.sql.toLowerCase().includes("insert into campaigns"))).toHaveLength(0);
    expect(calls.filter((c) => c.sql.toLowerCase().includes("insert into contributions"))).toHaveLength(0);
    expect(calls.some((c) => c.sql === "BEGIN")).toBe(true);
    expect(calls.some((c) => c.sql === "COMMIT")).toBe(true);
  });

  it("records the max ledger sequence in sync_state", async () => {
    const { mock, calls } = makeQueryMock();
    _pool.connect.mockImplementation(async () => ({ query: mock, release: vi.fn() }));

    const batch = [EVT_INIT, EVT_C1, EVT_C2];
    await ingestEvents(batch);

    const maxLedger = Math.max(...batch.map((e) => e.ledgerSequence));
    expect(
      calls.some(
        (c) =>
          c.sql.toLowerCase().includes("update sync_state") &&
          (c.params as number[])[0] === maxLedger
      )
    ).toBe(true);
  });

  it("handles out-of-order ledger sequences gracefully (reorg)", async () => {
    const { mock } = makeQueryMock();
    _pool.connect.mockImplementation(async () => ({ query: mock, release: vi.fn() }));

    // contribute arrives before initialize
    await expect(ingestEvents([EVT_C1, EVT_INIT])).resolves.toBeUndefined();
  });

  it("processes multiple contributions independently", async () => {
    const { mock, calls } = makeQueryMock();
    _pool.connect.mockImplementation(async () => ({ query: mock, release: vi.fn() }));

    await ingestEvents([EVT_INIT, EVT_C1, EVT_C2]);

    expect(calls.filter((c) => c.sql.toLowerCase().includes("insert into contributions"))).toHaveLength(2);
    expect(
      calls.filter(
        (c) =>
          c.sql.toLowerCase().includes("update campaigns") &&
          c.sql.toLowerCase().includes("total_raised")
      )
    ).toHaveLength(2);
  });

  it("rolls back the transaction when a DB error occurs", async () => {
    const calls: Array<{ sql: string }> = [];
    const failMock = vi.fn(async (sql: string) => {
      calls.push({ sql: sql.trim() });
      if (sql.toLowerCase().includes("insert into raw_events")) {
        throw new Error("simulated DB failure");
      }
      return { rows: [] };
    });
    _pool.connect.mockImplementation(async () => ({ query: failMock, release: vi.fn() }));

    await expect(ingestEvents([EVT_INIT])).rejects.toThrow("simulated DB failure");
    expect(calls.some((c) => c.sql === "ROLLBACK")).toBe(true);
  });
});
