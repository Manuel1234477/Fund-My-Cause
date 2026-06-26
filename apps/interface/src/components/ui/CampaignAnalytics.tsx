"use client";

import React from "react";
import { TrendingUp, Users, Target, Clock } from "lucide-react";
import { CampaignStats, CampaignInfo } from "@/types/soroban";

interface CampaignAnalyticsProps {
  stats: CampaignStats;
  info: CampaignInfo;
}

export function CampaignAnalytics({ stats, info }: CampaignAnalyticsProps) {
  const totalRaisedXlm = Number(stats.totalRaised) / 10_000_000;
  const goalXlm = Number(stats.goal) / 10_000_000;
  const progress = goalXlm > 0 ? (totalRaisedXlm / goalXlm) * 100 : 0;
  const avgContributionXlm = Number(stats.averageContribution) / 10_000_000;
  const largestContributionXlm = Number(stats.largestContribution) / 10_000_000;

  const daysRemaining = Math.max(0, Math.ceil((Number(info.deadline) * 1000 - Date.now()) / (1000 * 60 * 60 * 24)));
  const daysElapsed = Math.ceil((Date.now() - (Number(info.deadline) * 1000 - (daysRemaining * 24 * 60 * 60 * 1000))) / (1000 * 60 * 60 * 24));
  const dailyAverage = daysElapsed > 0 ? totalRaisedXlm / daysElapsed : 0;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-6">
      <h2 className="text-lg font-semibold text-gray-200">Campaign Analytics</h2>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-indigo-400" />
            <span className="text-xs text-gray-400">Progress</span>
          </div>
          <p className="text-xl font-bold">{progress.toFixed(1)}%</p>
        </div>
        
        <div className="bg-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-green-400" />
            <span className="text-xs text-gray-400">Contributors</span>
          </div>
          <p className="text-xl font-bold">{stats.contributorCount}</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target size={16} className="text-blue-400" />
            <span className="text-xs text-gray-400">Avg. Contribution</span>
          </div>
          <p className="text-xl font-bold">{avgContributionXlm.toFixed(2)} XLM</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-yellow-400" />
            <span className="text-xs text-gray-400">Daily Average</span>
          </div>
          <p className="text-xl font-bold">{dailyAverage.toFixed(2)} XLM</p>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-400">Detailed Statistics</h3>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Total Raised</span>
            <span className="font-medium">{totalRaisedXlm.toLocaleString()} XLM</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Goal</span>
            <span className="font-medium">{goalXlm.toLocaleString()} XLM</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Largest Contribution</span>
            <span className="font-medium">{largestContributionXlm.toFixed(2)} XLM</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Days Remaining</span>
            <span className="font-medium">{daysRemaining} days</span>
          </div>
        </div>
      </div>

      {/* Progress Visualization */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-400">Funding Progress</h3>
        <div className="relative h-4 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-500"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>{progress.toFixed(1)}% funded</span>
          <span>{goalXlm - totalRaisedXlm > 0 ? `${(goalXlm - totalRaisedXlm).toFixed(2)} XLM to go` : "Goal reached!"}</span>
        </div>
      </div>
    </div>
  );
}
