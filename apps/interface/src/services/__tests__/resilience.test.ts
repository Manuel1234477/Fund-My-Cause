import {
  getCampaignStatus,
  getCampaignProgress,
  filterCampaigns,
  sortCampaigns,
  searchCampaigns,
  queryCampaigns,
} from "@/services/campaign.service";
import { advancedSearch } from "@/services/search.service";
import { clearChaos } from "@/lib/chaos";
import type { Campaign } from "@/types/campaign";

const future = new Date(Date.now() + 86400_000).toISOString();
const past = new Date(Date.now() - 86400_000).toISOString();

const base: Omit<Campaign, "id" | "raised" | "goal" | "deadline" | "status"> = {
  contractId: "C1",
  title: "Test Campaign",
  description: "A test campaign description",
  creator: "GABC1234",
  token: "XLM",
  image: "https://example.com/img.jpg",
};

const active: Campaign = {
  ...base, id: "1", raised: 500, goal: 1000, deadline: future, status: "Active",
};
const funded: Campaign = {
  ...base, id: "2", raised: 1000, goal: 1000, deadline: future, status: "Successful",
};
const ended: Campaign = {
  ...base, id: "3", raised: 200, goal: 1000, deadline: past, status: "Active",
};

const campaigns = [active, funded, ended];

beforeEach(() => {
  clearChaos();
});

describe("campaign.service resilience", () => {
  it("handles empty campaign list gracefully", () => {
    const result = filterCampaigns([], "all");
    expect(result).toEqual([]);
  });

  it("handles null/undefined campaigns array gracefully", () => {
    expect(filterCampaigns(undefined as any, "all")).toEqual([]);
    expect(sortCampaigns(null as any, "newest")).toEqual([]);
    expect(searchCampaigns(undefined as any, "test")).toEqual([]);
  });

  it("handles partial data in getCampaignStatus", () => {
    const partial = { ...active, deadline: "", raised: 0, goal: 0 };
    const status = getCampaignStatus(partial);
    expect(["active", "funded"]).toContain(status);
  });

  it("handles negative values in getCampaignProgress", () => {
    const negative = { ...active, raised: -100, goal: 1000 };
    expect(getCampaignProgress(negative)).toBe(0);
  });

  it("handles zero goal in getCampaignProgress", () => {
    const zeroGoal = { ...active, goal: 0 };
    expect(getCampaignProgress(zeroGoal)).toBe(0);
  });

  it("handles missing deadline in getCampaignStatus", () => {
    const missingDate = { ...active, deadline: "" };
    expect(getCampaignStatus(missingDate)).toBe("active");
  });

  it("searchCampaigns with empty query returns all", () => {
    const result = searchCampaigns(campaigns, "");
    expect(result).toHaveLength(3);
  });

  it("searchCampaigns with non-string query returns all", () => {
    const result = searchCampaigns(campaigns, undefined as any);
    expect(result).toHaveLength(3);
  });

  it("searchCampaigns with no matches returns empty", () => {
    const result = searchCampaigns(campaigns, "zzzznonexistent");
    expect(result).toEqual([]);
  });

  it("queryCampaigns handles negative page", () => {
    const result = queryCampaigns(campaigns, { page: -1, pageSize: 10 } as any);
    expect(result.results).toHaveLength(3);
    expect(result.total).toBe(3);
  });

  it("queryCampaigns handles missing opts", () => {
    const result = queryCampaigns(campaigns, undefined as any);
    expect(result.results).toHaveLength(3);
    expect(result.total).toBe(3);
  });

  it("queryCampaigns handles empty campaigns", () => {
    const result = queryCampaigns([], {});
    expect(result.results).toEqual([]);
    expect(result.total).toBe(0);
  });

  it("sortCampaigns with ending-soon handles missing deadline", () => {
    const noDeadline = { ...active, deadline: "" };
    const result = sortCampaigns([active, noDeadline, funded], "ending-soon");
    expect(result).toHaveLength(3);
  });

  it("sortCampaigns with most-funded handles zero goal", () => {
    const zeroGoal = { ...active, goal: 0, raised: 0 };
    const result = sortCampaigns([active, zeroGoal, funded], "most-funded");
    expect(result).toHaveLength(3);
  });
});

describe("campaign.service crash-proof", () => {
  it("does not crash on NaN values", () => {
    const nanCampaign = { ...active, raised: NaN, goal: NaN };
    const progress = getCampaignProgress(nanCampaign);
    expect(Number.isNaN(progress) || progress >= 0).toBe(true);
  });

  it("does not crash on Infinity values", () => {
    const infCampaign = { ...active, raised: Infinity, goal: Infinity };
    expect(() => getCampaignProgress(infCampaign)).not.toThrow();
  });

  it("does not crash on deeply malformed data", () => {
    expect(() => filterCampaigns([null as any], "all")).not.toThrow();
  });

  it("does not crash on array with undefined entries", () => {
    const withUndefined: Campaign[] = [active, undefined as unknown as Campaign, funded];
    expect(() => filterCampaigns(withUndefined, "all")).not.toThrow();
  });
});

describe("search.service resilience", () => {
  it("handles null query gracefully", () => {
    const result = advancedSearch(campaigns, { query: null as unknown as string });
    expect(result.items.length).toBeGreaterThan(0);
  });

  it("handles extremely long query without crashing", () => {
    const longQuery = "a".repeat(10000);
    const result = advancedSearch(campaigns, { query: longQuery });
    expect(result).toBeDefined();
  });

  it("handles special characters in query", () => {
    const result = advancedSearch(campaigns, { query: "!@#$%^&*()" });
    expect(result.items).toEqual([]);
  });

  it("handles unicode/emoji in query", () => {
    const result = advancedSearch(campaigns, { query: "🌍 test 🔬" });
    expect(result).toBeDefined();
  });

  it("handles missing filters object", () => {
    const result = advancedSearch(campaigns, undefined as unknown as any);
    expect(result.items.length).toBeGreaterThan(0);
  });

  it("recovers after a failure (no global state corruption)", () => {
    const r1 = advancedSearch(campaigns, { query: "test" });
    expect(r1.items.length).toBeGreaterThan(0);

    const r2 = advancedSearch(campaigns, { query: "eco" });
    expect(r2.items.length).toBeGreaterThanOrEqual(0);

    const r3 = advancedSearch(campaigns, { query: "test" });
    expect(r3.items.length).toBe(r1.items.length);
  });
});
