/**
 * Saved-search persistence and alert matching service.
 *
 * Each saved search stores a name, the current filter set, and the set of
 * campaign IDs that were already seen so notifications only fire for *new*
 * matches.
 */

import type { SearchFilters } from "@/services/search.service";
import type { Campaign } from "@/types/campaign";
import {
  advancedSearch,
  loadPreferences,
} from "@/services/search.service";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SavedSearch {
  id: string;
  name: string;
  filters: SearchFilters;
  /** Wallet address the search belongs to (or "anonymous"). */
  walletAddress: string;
  createdAt: number;
  /** IDs of campaigns that were already seen by the alert engine. */
  seenIds: string[];
}

// ── Storage key ───────────────────────────────────────────────────────────────

const STORAGE_KEY = "fmc:saved-searches";

// ── Persistence helpers ───────────────────────────────────────────────────────

export function loadSavedSearches(): SavedSearch[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedSearch[]) : [];
  } catch {
    return [];
  }
}

export function persistSavedSearches(searches: SavedSearch[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
  } catch {
    // Ignore storage errors
  }
}

// ── CRUD helpers ──────────────────────────────────────────────────────────────

export function createSavedSearch(
  name: string,
  filters: SearchFilters,
  walletAddress: string,
  campaigns: Campaign[],
): SavedSearch {
  const result = advancedSearch(campaigns, { ...filters, page: 1, pageSize: 9999 }, loadPreferences());
  const seenIds = result.items.map((s) => s.campaign.id);
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: name.trim(),
    filters,
    walletAddress,
    createdAt: Date.now(),
    seenIds,
  };
}

export function updateSavedSearch(
  searches: SavedSearch[],
  id: string,
  patch: Partial<Pick<SavedSearch, "name" | "filters">>,
): SavedSearch[] {
  return searches.map((s) => (s.id === id ? { ...s, ...patch } : s));
}

export function deleteSavedSearch(searches: SavedSearch[], id: string): SavedSearch[] {
  return searches.filter((s) => s.id !== id);
}

// ── Alert matching ────────────────────────────────────────────────────────────

export interface SavedSearchAlert {
  savedSearch: SavedSearch;
  newCampaigns: Campaign[];
}

/**
 * Checks all saved searches against the latest campaign list and returns any
 * that now match campaigns the user hasn't seen yet.  Also updates `seenIds`
 * in-place so subsequent calls don't re-fire the same alerts.
 */
export function checkSavedSearchAlerts(
  searches: SavedSearch[],
  campaigns: Campaign[],
  walletAddress: string,
): SavedSearchAlert[] {
  const alerts: SavedSearchAlert[] = [];

  for (const search of searches) {
    if (search.walletAddress !== walletAddress) continue;

    const result = advancedSearch(campaigns, {
      ...search.filters,
      page: 1,
      pageSize: 9999,
    }, loadPreferences());

    const newCampaigns = result.items
      .map((s) => s.campaign)
      .filter((c) => !search.seenIds.includes(c.id));

    if (newCampaigns.length > 0) {
      // Mark as seen immediately to avoid duplicate alerts
      search.seenIds = [...search.seenIds, ...newCampaigns.map((c) => c.id)];
      alerts.push({ savedSearch: search, newCampaigns });
    }
  }

  return alerts;
}
