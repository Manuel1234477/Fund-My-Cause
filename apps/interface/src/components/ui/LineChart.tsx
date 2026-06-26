"use client";

import React from "react";
import { CampaignData } from "@/types/soroban";

interface LineChartProps {
  campaigns: CampaignData[];
}

export function LineChart({ campaigns }: LineChartProps) {
  if (campaigns.length === 0) return null;

  // Generate mock time-series data based on campaign progress
  const dataPoints = campaigns.map((campaign, index) => ({
    label: campaign.title.substring(0, 15),
    value: campaign.raised,
    goal: campaign.goal,
    progress: campaign.goal > 0 ? (campaign.raised / campaign.goal) * 100 : 0,
  }));

  const maxValue = Math.max(...dataPoints.map((d) => d.value), 1);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-gray-300 mb-4">Funding Progress Over Time</h3>
      
      {/* SVG Line Chart */}
      <div className="relative h-48 w-full">
        <svg viewBox="0 0 400 150" className="w-full h-full">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((pct) => (
            <line
              key={pct}
              x1="0"
              y1={150 - (pct / 100) * 150}
              x2="400"
              y2={150 - (pct / 100) * 150}
              stroke="#374151"
              strokeWidth="1"
              strokeDasharray="4"
            />
          ))}
          
          {/* Progress line */}
          <polyline
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="2"
            points={dataPoints.map((d, i) => {
              const x = (i / (dataPoints.length - 1 || 1)) * 400;
              const y = 150 - (d.progress / 100) * 150;
              return `${x},${y}`;
            }).join(" ")}
          />
          
          {/* Data points */}
          {dataPoints.map((d, i) => {
            const x = (i / (dataPoints.length - 1 || 1)) * 400;
            const y = 150 - (d.progress / 100) * 150;
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="4"
                fill="#6366f1"
                className="hover:r-6 transition-all cursor-pointer"
              />
            );
          })}
          
          {/* Gradient definition */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4">
        {dataPoints.slice(0, 5).map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-500" />
            <span className="text-xs text-gray-400">{d.label}</span>
          </div>
        ))}
        {dataPoints.length > 5 && (
          <span className="text-xs text-gray-500">+{dataPoints.length - 5} more</span>
        )}
      </div>
    </div>
  );
}
