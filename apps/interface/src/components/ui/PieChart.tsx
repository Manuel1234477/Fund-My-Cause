"use client";

import React from "react";
import { CampaignData } from "@/types/soroban";

interface PieChartProps {
  campaigns: CampaignData[];
}

export function PieChart({ campaigns }: PieChartProps) {
  if (campaigns.length === 0) return null;

  // Group campaigns by status
  const statusGroups = campaigns.reduce((acc, campaign) => {
    acc[campaign.status] = (acc[campaign.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const total = campaigns.length;
  const data = Object.entries(statusGroups).map(([status, count]) => ({
    status,
    count,
    percentage: (count / total) * 100,
  }));

  const colors: Record<string, string> = {
    Active: "#6366f1",
    Successful: "#10b981",
    Cancelled: "#ef4444",
    Refunded: "#f59e0b",
    Paused: "#6b7280",
  };

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  let currentOffset = 0;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-gray-300 mb-4">Campaign Status Distribution</h3>
      
      <div className="flex items-center gap-8">
        {/* Pie Chart */}
        <div className="relative">
          <svg width="140" height="140" viewBox="0 0 140 140">
            {data.map((item) => {
              const strokeDasharray = (item.percentage / 100) * circumference;
              const strokeDashoffset = -currentOffset;
              currentOffset += strokeDasharray;
              
              return (
                <circle
                  key={item.status}
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  stroke={colors[item.status] || "#6b7280"}
                  strokeWidth="20"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  transform="rotate(-90 70 70)"
                />
              );
            })}
          </svg>
          
          {/* Center text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-2xl font-bold">{total}</p>
              <p className="text-xs text-gray-400">Total</p>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2">
          {data.map((item) => (
            <div key={item.status} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: colors[item.status] || "#6b7280" }}
                />
                <span className="text-sm text-gray-300">{item.status}</span>
              </div>
              <span className="text-sm font-medium">
                {item.count} ({item.percentage.toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
