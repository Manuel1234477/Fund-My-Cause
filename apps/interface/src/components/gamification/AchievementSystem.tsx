"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award,
  Zap,
  Target,
  TrendingUp,
  Lock,
  Unlock,
  Share2,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  Achievement,
  AchievementProgress,
  AchievementTier,
  GamificationProfile,
} from "@/types/gamification";

interface AchievementSystemProps {
  userProfile?: GamificationProfile;
  achievements?: Achievement[];
  progressData?: AchievementProgress[];
  onShareAchievement?: (achievement: Achievement) => void;
  loading?: boolean;
}

// Achievement tier colors
const tierColors: Record<AchievementTier, string> = {
  common: "from-gray-400 to-gray-600",
  uncommon: "from-green-400 to-green-600",
  rare: "from-blue-400 to-blue-600",
  epic: "from-purple-400 to-purple-600",
  legendary: "from-yellow-400 to-yellow-600",
};

// Tier background colors for display
const tierBgColors: Record<AchievementTier, string> = {
  common: "bg-gray-100 dark:bg-gray-800",
  uncommon: "bg-green-100 dark:bg-green-900",
  rare: "bg-blue-100 dark:bg-blue-900",
  epic: "bg-purple-100 dark:bg-purple-900",
  legendary: "bg-yellow-100 dark:bg-yellow-900",
};

/**
 * Individual Achievement Badge
 */
function AchievementBadge({
  achievement,
  progress,
  onShare,
  isCompact = false,
}: {
  achievement?: Achievement;
  progress?: AchievementProgress;
  onShare?: () => void;
  isCompact?: boolean;
}) {
  const item = achievement || progress;
  if (!item) return null;

  const isUnlocked = achievement?.earnedAt || progress?.isUnlocked;
  const showProgress = progress && !isUnlocked;
  const progressPercent = progress
    ? (progress.progress / progress.required) * 100
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: isUnlocked ? 1.05 : 1 }}
      className={cn(
        "relative",
        isCompact ? "w-16 h-16" : "w-24 h-24",
        "flex flex-col items-center justify-center",
        "rounded-lg border transition-all duration-200",
        isUnlocked
          ? `border-2 bg-gradient-to-br ${tierColors[item.tier || "common"]} text-white shadow-lg`
          : "border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-gray-400",
      )}
    >
      {/* Icon */}
      <div className="text-2xl mb-1">{item.icon}</div>

      {/* Locked overlay */}
      {!isUnlocked && (
        <div className="absolute top-1 right-1">
          <Lock size={12} className="text-gray-400" />
        </div>
      )}

      {/* Progress ring for locked achievements */}
      {showProgress && (
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ transform: "rotate(-90deg)" }}
        >
          <circle
            cx="50%"
            cy="50%"
            r="38%"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            opacity="0.2"
          />
          <circle
            cx="50%"
            cy="50%"
            r="38%"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray={`${(Math.PI * 0.76 * progressPercent) / 100} 999`}
            className="text-yellow-400 transition-all duration-300"
          />
        </svg>
      )}

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap">
        <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs px-2 py-1 rounded shadow-lg">
          {item.title}
          {showProgress && <div className="text-xs mt-1">{`${progress.progress}/${progress.required}`}</div>}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Achievement detail modal
 */
function AchievementDetailModal({
  achievement,
  onClose,
  onShare,
}: {
  achievement: Achievement;
  onClose: () => void;
  onShare?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-sm w-full",
          `bg-gradient-to-br ${tierColors[achievement.tier]} text-white shadow-2xl`,
        )}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/80 hover:text-white"
        >
          ✕
        </button>

        {/* Achievement content */}
        <div className="text-center">
          <div className="text-6xl mb-4">{achievement.icon}</div>
          <h3 className="text-2xl font-bold mb-2">{achievement.title}</h3>
          <p className="text-sm opacity-90 mb-4">{achievement.description}</p>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
            <div className="bg-white/20 rounded p-2">
              <div className="opacity-75 text-xs mb-1">Tier</div>
              <div className="font-semibold capitalize">{achievement.tier}</div>
            </div>
            <div className="bg-white/20 rounded p-2">
              <div className="opacity-75 text-xs mb-1">Rarity</div>
              <div className="font-semibold">
                {achievement.unlockedPercentage
                  ? `${(100 - achievement.unlockedPercentage).toFixed(1)}%`
                  : "Rare"}
              </div>
            </div>
          </div>

          {/* NFT info */}
          {achievement.isNFT && (
            <div className="bg-white/20 rounded p-3 mb-6 text-sm">
              <div className="flex items-center gap-2 justify-center">
                <Trophy size={16} />
                <span>Minted as NFT</span>
              </div>
            </div>
          )}

          {/* Share button */}
          {onShare && (
            <button
              onClick={onShare}
              className="w-full bg-white text-current rounded-lg py-2 font-semibold hover:bg-white/90 transition flex items-center justify-center gap-2"
            >
              <Share2 size={16} />
              Share Achievement
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/**
 * Main Achievement System Component
 */
export function AchievementSystem({
  userProfile,
  achievements = [],
  progressData = [],
  onShareAchievement,
  loading = false,
}: AchievementSystemProps) {
  const [selectedAchievement, setSelectedAchievement] = useState<
    Achievement | undefined
  >();
  const [view, setView] = useState<"unlocked" | "progress" | "all">("all");

  const unlockedAchievements = achievements.filter((a) => a.earnedAt);
  const lockedAchievements = achievements.filter((a) => !a.earnedAt);

  const unlockedCount = unlockedAchievements.length;
  const totalCount = achievements.length;
  const completionPercent =
    totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Award className="w-8 h-8 mx-auto mb-2 animate-spin text-blue-500" />
          <p className="text-gray-500 dark:text-gray-400">
            Loading achievements...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl p-6">
        <div className="flex items-center gap-4 mb-4">
          <Trophy size={32} />
          <div>
            <h2 className="text-2xl font-bold">Achievement System</h2>
            <p className="text-sm opacity-90">Level {userProfile?.level || 1}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span>Progress</span>
            <span className="font-semibold">
              {unlockedCount}/{totalCount}
            </span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completionPercent}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-white rounded-full"
            />
          </div>
        </div>
      </div>

      {/* View tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {["all", "unlocked", "progress"].map((tab) => (
          <button
            key={tab}
            onClick={() => setView(tab as "unlocked" | "progress" | "all")}
            className={cn(
              "px-4 py-2 font-medium text-sm transition-colors capitalize",
              view === tab
                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200",
            )}
          >
            {tab === "progress" ? "In Progress" : tab}
            {tab === "unlocked" && ` (${unlockedCount})`}
            {tab === "progress" && ` (${lockedAchievements.length})`}
          </button>
        ))}
      </div>

      {/* Achievements grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <AnimatePresence mode="popLayout">
          {view === "all" || view === "unlocked"
            ? unlockedAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="cursor-pointer group"
                  onClick={() => setSelectedAchievement(achievement)}
                >
                  <AchievementBadge achievement={achievement} onShare={() => {}} />
                  <div className="mt-2 text-center hidden group-hover:block">
                    <p className="text-xs font-medium text-gray-900 dark:text-white line-clamp-2">
                      {achievement.title}
                    </p>
                  </div>
                </div>
              ))
            : null}

          {view === "all" || view === "progress"
            ? progressData.map((progress) => (
                <div key={progress.type} className="cursor-pointer group">
                  <AchievementBadge progress={progress} />
                  <div className="mt-2 text-center hidden group-hover:block">
                    <p className="text-xs font-medium text-gray-900 dark:text-white">
                      {progress.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {progress.progress}/{progress.required}
                    </p>
                  </div>
                </div>
              ))
            : null}
        </AnimatePresence>
      </div>

      {/* Empty state */}
      {view === "unlocked" && unlockedAchievements.length === 0 && (
        <div className="text-center py-12">
          <Lock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-500 dark:text-gray-400 mb-2">
            No achievements unlocked yet
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Start contributing to unlock achievements!
          </p>
        </div>
      )}

      {/* Achievement detail modal */}
      <AnimatePresence>
        {selectedAchievement && (
          <AchievementDetailModal
            achievement={selectedAchievement}
            onClose={() => setSelectedAchievement(undefined)}
            onShare={() => {
              onShareAchievement?.(selectedAchievement);
              setSelectedAchievement(undefined);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default AchievementSystem;
