import type { Campaign } from "@/types/campaign";

export type FilterTab = "all" | "active" | "funded" | "ended";
export type SortOption = "newest" | "most-funded" | "ending-soon";

export function getCampaignStatus(c: Campaign): FilterTab {
  if (!c || typeof c.raised !== "number" || typeof c.goal !== "number") return "active";
  if (c.raised >= c.goal) return "funded";
  if (c.deadline) {
    const deadline = new Date(c.deadline);
    if (!isNaN(deadline.getTime()) && deadline < new Date()) return "ended";
  }
  return "active";
}

export function getCampaignProgress(c: Campaign): number {
  if (!c || typeof c.goal !== "number" || c.goal <= 0) return 0;
  if (typeof c.raised !== "number" || c.raised < 0) return 0;
  return Math.min(100, (c.raised / c.goal) * 100);
}

export function filterCampaigns(
  campaigns: Campaign[],
  filter: FilterTab,
): Campaign[] {
  if (!Array.isArray(campaigns)) return [];
  if (filter === "all") return campaigns.filter(Boolean);
  return campaigns.filter((c) => c && getCampaignStatus(c) === filter);
}

export function sortCampaigns(
  campaigns: Campaign[],
  sort: SortOption,
): Campaign[] {
  if (!Array.isArray(campaigns)) return [];
  return [...campaigns].filter(Boolean).sort((a, b) => {
    if (sort === "most-funded") {
      const aRatio = a.goal > 0 ? a.raised / a.goal : 0;
      const bRatio = b.goal > 0 ? b.raised / b.goal : 0;
      return bRatio - aRatio;
    }
    if (sort === "ending-soon") {
      const aTime = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const bTime = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      return aTime - bTime;
    }
    return Number(b.id) - Number(a.id);
  });
}

export function searchCampaigns(
  campaigns: Campaign[],
  query: string,
): Campaign[] {
  if (!Array.isArray(campaigns)) return [];
  if (!query || typeof query !== "string") return campaigns.filter(Boolean);
  const q = query.toLowerCase();
  return campaigns.filter(
    (c) =>
      c &&
      ((c.title && c.title.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q)) ||
        (c.creator && c.creator.toLowerCase().includes(q))),
  );
}

export function queryCampaigns(
  campaigns: Campaign[],
  opts: {
    query?: string;
    filter?: FilterTab;
    sort?: SortOption;
    page?: number;
    pageSize?: number;
  },
): { results: Campaign[]; total: number; totalPages: number } {
  if (!Array.isArray(campaigns)) {
    return { results: [], total: 0, totalPages: 0 };
  }
  const {
    query = "",
    filter = "all",
    sort = "newest",
    page = 1,
    pageSize = 9,
  } = opts ?? {};
  const searched = searchCampaigns(campaigns, query);
  const filtered = filterCampaigns(searched, filter);
  const sorted = sortCampaigns(filtered, sort);
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.max(1, page);
  const results = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);
  return { results, total, totalPages };
}
