"use client";

import React, { useMemo } from "react";
import { TrendingUp, Users, Target, Eye } from "lucide-react";
import { CampaignData } from "@/types/soroban";
import { LineChart } from "./LineChart";
import { PieChart } from "./PieChart";
import { AnalyticsExport } from "./AnalyticsExport";
import { PredictiveAnalytics } from "./PredictiveAnalytics";
import { useRealTimeAnalytics } from "@/hooks/useRealTimeAnalytics";

interface Props {
  campaigns: CampaignData[];
  timeRange?: "7d" | "30d" | "90d" | "all";
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center gap-4">
      <div className="p-2 rounded-xl bg-indigo-900/40 text-indigo-400">{icon}</div>
      <div>
        <p className="text-xl font-bold">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// Minimal bar chart using divs — no external chart library needed
function ContributionBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-24 truncate text-gray-400 text-xs">{label}</span>
      <div className="flex-1 bg-gray-800 rounded-full h-2">
        <div
          className="bg-indigo-500 h-2 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-400 w-16 text-right">{value.toLocaleString()} XLM</span>
    </div>
  );
}

export function AnalyticsDashboard({ campaigns, timeRange = "all" }: Props) {
  const filteredCampaigns = useMemo(() => {
    if (timeRange === "all") return campaigns;

    const now = Date.now();
    const cutoffDate = new Date();

    switch (timeRange) {
      case "7d":
        cutoffDate.setDate(cutoffDate.getDate() - 7);
        break;
      case "30d":
        cutoffDate.setDate(cutoffDate.getDate() - 30);
        break;
      case "90d":
        cutoffDate.setDate(cutoffDate.getDate() - 90);
        break;
      default:
        return campaigns;
    }

    return campaigns.filter((c) => {
      const campaignDate = new Date(c.deadline).getTime();
      return campaignDate >= cutoffDate.getTime() && campaignDate <= now;
    });
  }, [campaigns, timeRange]);

  const { analytics: realtimeCampaigns, connected, error, lastUpdated } = useRealTimeAnalytics(filteredCampaigns);
  const displayCampaigns = realtimeCampaigns.length > 0 ? realtimeCampaigns : filteredCampaigns;

  const stats = useMemo(() => {
    const totalRaised = displayCampaigns.reduce((s, c) => s + c.raised, 0);
    const totalGoal = displayCampaigns.reduce((s, c) => s + c.goal, 0);
    const active = displayCampaigns.filter((c) => c.status === "Active").length;
    const successful = displayCampaigns.filter((c) => c.status === "Successful").length;
    return { totalRaised, totalGoal, active, successful };
  }, [displayCampaigns]);

  const maxRaised = useMemo(
    () => Math.max(...displayCampaigns.map((c) => c.raised), 1),
    [displayCampaigns]
  );

  if (displayCampaigns.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <TrendingUp size={32} className="mx-auto mb-3 opacity-40" />
        <p>No campaign data to analyze yet.</p>
      </div>
    );
  }

  const conversionRate = stats.totalGoal > 0
    ? ((stats.totalRaised / stats.totalGoal) * 100).toFixed(1)
    : "0";

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Raised" value={`${stats.totalRaised.toLocaleString(undefined, { maximumFractionDigits: 0 })} XLM`} icon={<TrendingUp size={18} />} />
        <StatCard label="Active Campaigns" value={String(stats.active)} icon={<Eye size={18} />} />
        <StatCard label="Successful" value={String(stats.successful)} icon={<Target size={18} />} />
        <StatCard label="Avg. Conversion" value={`${conversionRate}%`} icon={<Users size={18} />} />
      </div>

      {/* New chart components */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <LineChart campaigns={displayCampaigns} />
        <PieChart campaigns={displayCampaigns} />
      </div>

      <PredictiveAnalytics campaigns={displayCampaigns} connected={connected} lastUpdated={lastUpdated} error={error} />

      {/* Contribution timeline (per campaign bar chart) */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-300">Raised per Campaign</h3>
        <div className="space-y-3">
          {displayCampaigns.map((c) => (
            <ContributionBar
              key={c.contractId}
              label={c.title}
              value={c.raised}
              max={maxRaised}
            />
          ))}
        </div>
      </div>

      {/* Conversion funnel */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-gray-300">Conversion Funnel</h3>
        <div className="flex flex-col gap-2">
          {[
            { label: "Campaigns Created", value: filteredCampaigns.length, pct: 100 },
            { label: "Active", value: stats.active, pct: filteredCampaigns.length > 0 ? (stats.active / filteredCampaigns.length) * 100 : 0 },
            { label: "Reached Goal", value: stats.successful, pct: filteredCampaigns.length > 0 ? (stats.successful / filteredCampaigns.length) * 100 : 0 },
          ].map((step) => (
            <div key={step.label} className="flex items-center gap-3 text-sm">
              <span className="w-36 text-gray-400 text-xs">{step.label}</span>
              <div className="flex-1 bg-gray-800 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-indigo-600 to-indigo-400 h-3 rounded-full transition-all"
                  style={{ width: `${step.pct}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 w-8 text-right">{step.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Export */}
      <div className="flex justify-end">
        <AnalyticsExport campaigns={filteredCampaigns} />
      </div>
    </div>
  );
}
