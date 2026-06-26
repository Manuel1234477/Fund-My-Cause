"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  ChevronLeft,
  ChevronRight,
  Medal,
  TrendingUp,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  LeaderboardEntry,
  LeaderboardFilter,
  ChallengeLeaderboardEntry,
} from "@/types/gamification";

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  userAddress?: string;
  timeframe?: "all-time" | "this-month" | "this-week";
  type?: "points" | "contributions" | "achievements" | "referrals";
  onTimeframeChange?: (timeframe: "all-time" | "this-month" | "this-week") => void;
  onTypeChange?: (type: "points" | "contributions" | "achievements" | "referrals") => void;
  loading?: boolean;
  totalPages?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  pageSize?: number;
}

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
  showAddresses: boolean;
}

// Medal icons for top 3
const medalIcons = {
  1: <Medal className="w-5 h-5 text-yellow-500" />,
  2: <Medal className="w-5 h-5 text-gray-400" />,
  3: <Medal className="w-5 h-5 text-orange-400" />,
};

/**
 * Format address for display (shortened)
 */
function formatAddress(address: string, show: boolean = true): string {
  if (!show) return "••••••••";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Leaderboard row component
 */
function LeaderboardRow({
  entry,
  isCurrentUser,
  showAddresses,
}: LeaderboardRowProps) {
  const isTopThree = entry.rank <= 3;
  const medal = medalIcons[entry.rank as 1 | 2 | 3];

  return (
    <motion.tr
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "border-b border-gray-200 dark:border-gray-700 last:border-0 transition-colors",
        "hover:bg-gray-50 dark:hover:bg-gray-800/50",
        isCurrentUser && "bg-blue-50 dark:bg-blue-900/20",
      )}
    >
      {/* Rank */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {isTopThree ? (
            medal
          ) : (
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 w-5">
              {entry.rank}
            </span>
          )}
        </div>
      </td>

      {/* Display name / Address */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {entry.displayName ? (
            <>
              <span className="font-medium text-gray-900 dark:text-white">
                {entry.displayName}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatAddress(entry.address, showAddresses)}
              </span>
            </>
          ) : (
            <span className="font-medium text-gray-900 dark:text-white">
              {formatAddress(entry.address, showAddresses)}
            </span>
          )}
          {isCurrentUser && (
            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
              You
            </span>
          )}
        </div>
      </td>

      {/* Level badge */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
            {entry.level}
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Lvl</span>
        </div>
      </td>

      {/* Points / Score */}
      <td className="px-4 py-3 text-right">
        <div className="font-semibold text-gray-900 dark:text-white">
          {entry.totalPoints.toLocaleString()}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">points</div>
      </td>

      {/* Contributions count */}
      <td className="px-4 py-3 text-right">
        <div className="font-semibold text-gray-900 dark:text-white">
          {entry.contributionCount}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          contribution{entry.contributionCount !== 1 ? "s" : ""}
        </div>
      </td>

      {/* Achievements */}
      <td className="px-4 py-3 text-center">
        <div className="inline-flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-3 py-1 rounded-full text-sm font-medium">
          <Trophy size={14} />
          {entry.achievements}
        </div>
      </td>

      {/* Badge */}
      {entry.badge && (
        <td className="px-4 py-3">
          <span className="text-sm px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full">
            ⭐ {entry.badge}
          </span>
        </td>
      )}
    </motion.tr>
  );
}

/**
 * Main Leaderboard Component
 */
export function Leaderboard({
  entries,
  userAddress,
  timeframe = "all-time",
  type = "points",
  onTimeframeChange,
  onTypeChange,
  loading = false,
  totalPages = 1,
  currentPage = 0,
  onPageChange,
  pageSize = 10,
}: LeaderboardProps) {
  const [showAddresses, setShowAddresses] = useState(false);

  const timeframeOptions: Array<
    "all-time" | "this-month" | "this-week"
  > = ["all-time", "this-month", "this-week"];
  const typeOptions: Array<
    "points" | "contributions" | "achievements" | "referrals"
  > = ["points", "contributions", "achievements", "referrals"];

  const typeLabels = {
    points: "Top Points",
    contributions: "Top Contributors",
    achievements: "Achievement Hunters",
    referrals: "Referral Champions",
  };

  const userInLeaderboard = entries.find((e) => e.address === userAddress);
  const userRank = userInLeaderboard?.rank;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Trophy className="w-8 h-8 mx-auto mb-2 animate-bounce text-yellow-500" />
          <p className="text-gray-500 dark:text-gray-400">
            Loading leaderboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Trophy size={32} />
          <div>
            <h2 className="text-2xl font-bold">{typeLabels[type]}</h2>
            {userRank && (
              <p className="text-sm opacity-90">
                Your rank: #{userRank} 🎯
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Timeframe tabs */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          {timeframeOptions.map((tf) => (
            <button
              key={tf}
              onClick={() => onTimeframeChange?.(tf)}
              className={cn(
                "px-4 py-2 font-medium text-sm transition-colors capitalize",
                timeframe === tf
                  ? "text-yellow-600 dark:text-yellow-400 border-b-2 border-yellow-600 dark:border-yellow-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200",
              )}
            >
              {tf.replace(/-/g, " ")}
            </button>
          ))}
        </div>

        {/* Type buttons */}
        <div className="flex gap-2 flex-wrap">
          {typeOptions.map((t) => (
            <button
              key={t}
              onClick={() => onTypeChange?.(t)}
              className={cn(
                "px-3 py-1 rounded-full text-sm font-medium transition-colors capitalize",
                type === t
                  ? "bg-yellow-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Toggle address visibility */}
        <button
          onClick={() => setShowAddresses(!showAddresses)}
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
          aria-label={
            showAddresses ? "Hide addresses" : "Show addresses"
          }
        >
          {showAddresses ? (
            <>
              <Eye size={16} />
              <span>Hide</span>
            </>
          ) : (
            <>
              <EyeOff size={16} />
              <span>Show</span>
            </>
          )}
        </button>
      </div>

      {/* Leaderboard table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <table className="w-full text-sm" role="table">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <th
                scope="col"
                className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white"
              >
                Rank
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white"
              >
                User
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-white"
              >
                Level
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white"
              >
                {type === "points"
                  ? "Points"
                  : type === "contributions"
                    ? "Contributed"
                    : "Achievements"}
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white"
              >
                Contributions
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-white"
              >
                Badges
              </th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {entries.map((entry) => (
                <LeaderboardRow
                  key={entry.address}
                  entry={entry}
                  isCurrentUser={entry.address === userAddress}
                  showAddresses={showAddresses}
                />
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Empty state */}
      {entries.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-500 dark:text-gray-400 mb-2">
            No leaderboard data available
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => onPageChange?.(currentPage - 1)}
            disabled={currentPage === 0}
            className={cn(
              "p-2 rounded-lg transition-colors",
              currentPage === 0
                ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800",
            )}
          >
            <ChevronLeft size={20} />
          </button>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            Page {currentPage + 1} of {totalPages}
          </div>

          <button
            onClick={() => onPageChange?.(currentPage + 1)}
            disabled={currentPage >= totalPages - 1}
            className={cn(
              "p-2 rounded-lg transition-colors",
              currentPage >= totalPages - 1
                ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800",
            )}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}

export default Leaderboard;
