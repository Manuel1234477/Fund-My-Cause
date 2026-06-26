import {
  filterByDateRange,
  filterByType,
  filterByCampaign,
  applyFilters,
  type ExportRecord,
} from "@/lib/exportTransactions";

const makeRecord = (overrides: Partial<ExportRecord> = {}): ExportRecord => ({
  txHash: "abc123",
  contributor: "GABC",
  amountXlm: 10,
  timestamp: "2024-06-15T12:00:00Z",
  campaignId: "campaign-1",
  campaignTitle: "Test Campaign",
  status: "Confirmed",
  ...overrides,
});

const records: ExportRecord[] = [
  makeRecord({ txHash: "tx1", timestamp: "2024-01-10T00:00:00Z", campaignId: "c1", status: "Confirmed" }),
  makeRecord({ txHash: "tx2", timestamp: "2024-03-20T00:00:00Z", campaignId: "c1", status: "Pending" }),
  makeRecord({ txHash: "tx3", timestamp: "2024-06-01T00:00:00Z", campaignId: "c2", status: "Confirmed" }),
  makeRecord({ txHash: "tx4", timestamp: "2024-09-15T00:00:00Z", campaignId: "c2", status: "Failed" }),
];

describe("filterByDateRange", () => {
  it("returns all records when range is empty", () => {
    expect(filterByDateRange(records, { from: "", to: "" })).toHaveLength(4);
  });

  it("filters by from date (inclusive)", () => {
    const result = filterByDateRange(records, { from: "2024-03-20", to: "" });
    expect(result.map((r) => r.txHash)).toEqual(["tx2", "tx3", "tx4"]);
  });

  it("filters by to date (inclusive, end of day)", () => {
    const result = filterByDateRange(records, { from: "", to: "2024-03-20" });
    expect(result.map((r) => r.txHash)).toEqual(["tx1", "tx2"]);
  });

  it("filters by both from and to", () => {
    const result = filterByDateRange(records, { from: "2024-03-20", to: "2024-06-01" });
    expect(result.map((r) => r.txHash)).toEqual(["tx2", "tx3"]);
  });

  it("returns empty when range matches nothing", () => {
    expect(filterByDateRange(records, { from: "2025-01-01", to: "2025-12-31" })).toHaveLength(0);
  });
});

describe("filterByType", () => {
  it("returns all records when type is empty", () => {
    expect(filterByType(records, "")).toHaveLength(4);
  });

  it("filters by Confirmed (case-insensitive)", () => {
    const result = filterByType(records, "confirmed");
    expect(result.map((r) => r.txHash)).toEqual(["tx1", "tx3"]);
  });

  it("filters by Failed", () => {
    expect(filterByType(records, "Failed")).toHaveLength(1);
  });
});

describe("filterByCampaign", () => {
  it("returns all records when campaignId is empty", () => {
    expect(filterByCampaign(records, "")).toHaveLength(4);
  });

  it("filters by campaign c1", () => {
    const result = filterByCampaign(records, "c1");
    expect(result.map((r) => r.txHash)).toEqual(["tx1", "tx2"]);
  });
});

describe("applyFilters (AND semantics)", () => {
  it("combines type and dateRange filters", () => {
    const result = applyFilters(records, {
      dateRange: { from: "2024-01-01", to: "2024-06-30" },
      type: "Confirmed",
      campaignId: "",
    });
    expect(result.map((r) => r.txHash)).toEqual(["tx1", "tx3"]);
  });

  it("combines type, date and campaign filters", () => {
    const result = applyFilters(records, {
      dateRange: { from: "2024-01-01", to: "2024-12-31" },
      type: "Confirmed",
      campaignId: "c2",
    });
    expect(result.map((r) => r.txHash)).toEqual(["tx3"]);
  });

  it("returns all when no filters applied", () => {
    expect(applyFilters(records, { dateRange: { from: "", to: "" }, type: "", campaignId: "" })).toHaveLength(4);
  });
});
