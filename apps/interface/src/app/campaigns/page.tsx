"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { PledgeModal } from "@/components/ui/PledgeModal";
import { LoadingSkeletonGrid } from "@/components/ui/LoadingSkeleton";
import { ALL_CAMPAIGNS } from "@/lib/campaigns";
import { GitCompare } from "lucide-react";
import { useComparison } from "@/context/ComparisonContext";
import { ShareModal } from "@/components/ui/ShareModal";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { BreadcrumbProvider } from "@/context/BreadcrumbContext";
import { AdvancedSearch } from "@/components/search/AdvancedSearch";
import { SearchResults } from "@/components/search/SearchResults";
import { useAdvancedSearch } from "@/hooks/useAdvancedSearch";
import { useSavedSearches } from "@/hooks/useSavedSearches";
import { useWallet } from "@/hooks/useWallet";

// ── Inner component (requires useSearchParams, wrapped in Suspense) ────────────

function CampaignsInner() {
  const { selected, clear } = useComparison();
  const { address } = useWallet();
  const [pledge, setPledge] = useState<string | null>(null);
  const [shareTarget, setShareTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const {
    filters,
    inputValue,
    setInputValue,
    searchResult,
    suggestions,
    recommendations,
    preferences,
    showAdvanced,
    setShowAdvanced,
    hasActiveFilters,
    setFilter,
    setPage,
    setPageSize,
    applyAdvancedFilters,
    clearAdvancedFilters,
    clearAll,
    clearSearch,
    restoreFilters,
  } = useAdvancedSearch(ALL_CAMPAIGNS);

  const { savedSearches, saveSearch, editSearch, removeSearch } =
    useSavedSearches(ALL_CAMPAIGNS, address ?? "");

  return (
    <>
      <AdvancedSearch
        inputValue={inputValue}
        onInputChange={setInputValue}
        filters={filters}
        onFilterChange={setFilter}
        onApplyAdvanced={applyAdvancedFilters}
        onClearAdvanced={clearAdvancedFilters}
        onClearAll={clearAll}
        onClearSearch={clearSearch}
        suggestions={suggestions}
        showAdvanced={showAdvanced}
        onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
        hasActiveFilters={hasActiveFilters}
        recentSearches={preferences.recentSearches}
        savedSearches={savedSearches}
        onSaveSearch={(name) => saveSearch(name, filters)}
        onRestoreSearch={restoreFilters}
        onDeleteSearch={removeSearch}
        onRenameSearch={(id, name) => editSearch(id, { name })}
      />

      <div className="mt-6">
        <SearchResults
          searchResult={searchResult}
          recommendations={recommendations}
          query={inputValue.trim()}
          currentPage={filters.page ?? 1}
          pageSize={filters.pageSize ?? 9}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onPledge={(id) => setPledge(id)}
          onShare={(id, title) => setShareTarget({ id, title })}
          onClearAll={clearAll}
        />
      </div>

      {/* Pledge modal */}
      {pledge && (
        <PledgeModal
          campaignTitle={
            ALL_CAMPAIGNS.find((c) => c.id === pledge)?.title ?? pledge
          }
          onClose={() => setPledge(null)}
        />
      )}

      {/* Share modal */}
      {shareTarget && (
        <ShareModal
          campaignId={shareTarget.id}
          campaignTitle={shareTarget.title}
          onClose={() => setShareTarget(null)}
        />
      )}

      {/* Comparison floating bar */}
      {selected.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-900 border border-gray-700 rounded-2xl px-5 py-3 shadow-2xl">
          <GitCompare size={16} className="text-indigo-400" />
          <span className="text-sm text-gray-300">
            {selected.length} selected
          </span>
          <Link
            href="/compare"
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-medium transition"
          >
            Compare
          </Link>
          <button
            onClick={clear}
            className="text-gray-500 hover:text-gray-300 text-xs transition"
          >
            Clear
          </button>
        </div>
      )}
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DiscoveryPage() {
  return (
    <BreadcrumbProvider>
      <main className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">
        <Navbar />
        <div className="max-w-6xl mx-auto px-6 py-12">
          <Breadcrumb
            crumbs={[{ label: "Campaigns" }]}
            className="mb-4 text-gray-500"
          />
          <h1 className="text-3xl font-bold mb-2">Discover Campaigns</h1>
          <p className="text-gray-500 mb-8">
            Find and support causes that matter to you
          </p>
          <Suspense fallback={<LoadingSkeletonGrid count={6} />}>
            <CampaignsInner />
          </Suspense>
        </div>
      </main>
    </BreadcrumbProvider>
  );
}
