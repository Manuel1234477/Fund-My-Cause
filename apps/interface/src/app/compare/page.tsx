"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { CampaignSelector } from "@/components/ui/CampaignSelector";
import { ComparisonTable } from "@/components/ui/ComparisonTable";
import { ComparisonChart } from "@/components/ui/ComparisonChart";
import { useComparison } from "@/context/ComparisonContext";
import { ALL_CAMPAIGNS } from "@/lib/campaigns";
import { formatXlm } from "@/lib/price";
import { Share2, X, ArrowLeft, Check } from "lucide-react";

export default function ComparePage() {
  const { selected, clear, toggle, hydrate } = useComparison();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [copied, setCopied] = useState(false);

  // Hydrate from ?ids= on first load
  useEffect(() => {
    const idsParam = searchParams.get("ids");
    if (idsParam) {
      const ids = idsParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (ids.length > 0) hydrate(ids);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const campaigns = selected
    .map((id) => ALL_CAMPAIGNS.find((c) => c.id === id))
    .filter(Boolean) as typeof ALL_CAMPAIGNS;

  const handleShare = async () => {
    const url = `${window.location.origin}/compare?ids=${selected.join(",")}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback for environments without clipboard API
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (campaigns.length === 0) {
    return (
      <main className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)]">
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 py-24 text-center">
          <p className="text-gray-400 mb-4">
            No campaigns selected for comparison.
          </p>
          <Link
            href="/campaigns"
            className="text-indigo-400 hover:text-indigo-300 underline"
          >
            Browse campaigns
          </Link>
        </div>
      </main>
    );
  }

  const rows: {
    label: string;
    render: (c: (typeof ALL_CAMPAIGNS)[0]) => React.ReactNode;
  }[] = [
    { label: "Status", render: (c) => c.status },
    { label: "Raised", render: (c) => formatXlm(c.raised, null) },
    { label: "Goal", render: (c) => formatXlm(c.goal, null) },
    {
      label: "Progress",
      render: (c) => {
        const pct = c.goal > 0 ? (c.raised / c.goal) * 100 : 0;
        return (
          <div className="space-y-1">
            <ProgressBar progress={pct} />
            <span className="text-xs text-gray-400">{pct.toFixed(1)}%</span>
          </div>
        );
      },
    },
    {
      label: "Deadline",
      render: (c) => new Date(c.deadline).toLocaleDateString(),
    },
    { label: "Contributors", render: (c) => c.contributorCount ?? "—" },
    { label: "Token", render: (c) => c.token },
  ];

  return (
    <main className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)]">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="text-gray-400 hover:text-white transition"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold">Compare Campaigns</h1>
            <span className="text-sm text-gray-500">
              ({campaigns.length} selected)
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Campaign selector */}
            <CampaignSelector />

            {/* View mode toggle */}
            <div className="flex rounded-xl border border-[var(--color-border)] overflow-hidden">
              {VIEW_MODES.map((mode) => (
                <button
                  key={mode.value}
                  onClick={() => setViewMode(mode.value)}
                  aria-pressed={viewMode === mode.value}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition",
                    viewMode === mode.value
                      ? "bg-[var(--color-brand)] text-white"
                      : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]",
                  )}
                >
                  {mode.icon}
                  {mode.label}
                </button>
              ))}
            </div>

            {/* Actions */}
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-sm transition"
              aria-label="Copy comparison link"
            >
              {copied ? (
                <Check size={14} className="text-green-400" />
              ) : (
                <Share2 size={14} />
              )}
              {copied ? "Copied!" : "Share"}
            </button>
            <button
              onClick={clear}
              aria-label="Clear all campaigns"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-surface-elevated)] hover:bg-[var(--color-border-subtle)] text-sm text-[var(--color-text-secondary)] transition"
            >
              <X size={14} /> Clear
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-4 py-3 text-gray-500 font-medium w-32">
                  Metric
                </th>
                {campaigns.map((c) => (
                  <th key={c.id} className="px-4 py-3 text-left">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-white">
                        {c.title}
                      </span>
                      <button
                        onClick={() => toggle(c.id)}
                        aria-label={`Remove ${c.title} from comparison`}
                        className="text-gray-600 hover:text-gray-300 transition flex-shrink-0"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.label}
                  className={i % 2 === 0 ? "bg-gray-900/40" : ""}
                >
                  <td className="px-4 py-3 text-gray-500 font-medium">
                    {row.label}
                  </td>
                  {campaigns.map((c) => (
                    <td key={c.id} className="px-4 py-3 text-gray-200">
                      {row.render(c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer hint */}
        <p className="text-xs text-[var(--color-text-muted)] mt-8 text-center">
          Select up to 4 campaigns from the{" "}
          <Link
            href="/campaigns"
            className="text-[var(--color-brand)] hover:underline"
          >
            campaigns page
          </Link>{" "}
          or use the &quot;Add Campaign&quot; button above to compare.
        </p>
      </div>
    </main>
  );
}
