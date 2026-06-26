"use client";

import { Sparkles, TrendingUp } from "lucide-react";
import { CampaignCard } from "@/components/ui/CampaignCard";
import {
  EmptyState,
  NoCampaignsIllustration,
} from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import type { SearchResult } from "@/services/search.service";
import type { Campaign } from "@/types/campaign";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  searchResult: SearchResult;
  recommendations: { campaigns: Campaign[]; reason: string };
  query: string;
  currentPage: number;
  pageSize: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onPledge: (id: string) => void;
  onShare: (id: string, title: string) => void;
  onClearAll: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SearchResults({
  searchResult,
  recommendations,
  query,
  currentPage,
  pageSize,
  pageSizeOptions = [9, 18, 36],
  onPageChange,
  onPageSizeChange,
  onPledge,
  onShare,
  onClearAll,
}: Props) {
  const { items, total, totalPages, durationMs, didYouMean } = searchResult;
  const hasQuery = query.trim().length > 0;
  const resultStart = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const resultEnd = Math.min(total, currentPage * pageSize);

  // Only show recommendations on zero results — helps users discover campaigns
  // when their search/filter returns nothing, without cluttering result views.
  const showRecommendations =
    recommendations.campaigns.length > 0 && total === 0;

  // ── Empty state ────────────────────────────────────────────────────────────

  if (total === 0) {
    return (
      <div className="space-y-10">
        <EmptyState
          illustration={<NoCampaignsIllustration />}
          title="No campaigns found"
          description={
            didYouMean
              ? `Did you mean "${didYouMean}"? Try adjusting your search or filters.`
              : "Try adjusting your search or filters to find what you're looking for."
          }
          action={{ label: "Browse All Campaigns", onClick: onClearAll }}
        />

        {showRecommendations && (
          <RecommendationSection
            recommendations={recommendations}
            onPledge={onPledge}
            onShare={onShare}
            query={query}
          />
        )}
      </div>
    );
  }

  // ── Results grid ───────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Result metadata */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-gray-500">
          Showing {resultStart}–{resultEnd} of {total} campaign
          {total === 1 ? "" : "s"}
          {hasQuery && (
            <span className="text-gray-400"> for &ldquo;{query}&rdquo;</span>
          )}
          <span className="text-gray-600 ml-2 text-xs">({durationMs}ms)</span>
        </p>
        {hasQuery && (
          <span className="flex items-center gap-1.5 text-xs text-indigo-400">
            <Sparkles size={12} />
            Ranked by semantic relevance
          </span>
        )}
      </div>

      {/* Campaign grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {items.map((scored, i) => (
          <CampaignCard
            key={scored.campaign.id}
            campaign={scored.campaign}
            onPledge={onPledge}
            onShare={onShare}
            index={i}
            query={query}
          />
        ))}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={total}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        pageSizeOptions={pageSizeOptions}
      />

      {/* Personalised recommendations below main results */}
      {showRecommendations && (
        <RecommendationSection
          recommendations={recommendations}
          onPledge={onPledge}
          onShare={onShare}
          query={query}
        />
      )}
    </div>
  );
}

// ── Recommendation section ─────────────────────────────────────────────────────

function RecommendationSection({
  recommendations,
  onPledge,
  onShare,
  query,
}: {
  recommendations: { campaigns: Campaign[]; reason: string };
  onPledge: (id: string) => void;
  onShare: (id: string, title: string) => void;
  query: string;
}) {
  const isPersonalised = recommendations.reason !== "Trending campaigns";

  return (
    <div className="border-t border-gray-200 dark:border-gray-800 pt-8 space-y-4">
      <div className="flex items-center gap-2">
        {isPersonalised ? (
          <Sparkles size={16} className="text-indigo-400" />
        ) : (
          <TrendingUp size={16} className="text-emerald-400" />
        )}
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          {recommendations.reason}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {recommendations.campaigns.map((campaign, i) => (
          <CampaignCard
            key={campaign.id}
            campaign={campaign}
            onPledge={onPledge}
            onShare={onShare}
            index={i}
            query={query}
          />
        ))}
      </div>
    </div>
  );
}
