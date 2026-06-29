"use client";

import React from "react";
import { X, Trophy, Share2, Wallet, ArrowRight } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { localeToIntlCode } from "@/lib/format";
import { useFocusTrap } from "@/hooks/useFocusTrap";

interface GoalSuccessModalProps {
  campaignTitle: string;
  totalRaisedXlm: number;
  onClose: () => void;
  onShare: () => void;
  onWithdraw: () => void;
  /** Whether the creator has already withdrawn funds */
  alreadyWithdrawn?: boolean;
}

export function GoalSuccessModal({
  campaignTitle,
  totalRaisedXlm,
  onClose,
  onShare,
  onWithdraw,
  alreadyWithdrawn = false,
}: GoalSuccessModalProps) {
  const t = useTranslations("goalSuccess");
  const locale = useLocale();
  const dialogRef = useFocusTrap(true, { onEscape: onClose }) as React.RefObject<HTMLDivElement>;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="goal-success-title"
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
              <Trophy size={20} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 id="goal-success-title" className="font-bold text-gray-900 dark:text-white">{t("title")}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{campaignTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={t("close")}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-500"
          >
            <X size={16} />
          </button>
        </div>

        {/* Amount raised */}
        <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 text-center">
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
            {totalRaisedXlm.toLocaleString(localeToIntlCode(locale))} XLM
          </p>
          <p className="text-sm text-green-700 dark:text-green-500 mt-1">{t("raisedTotal")}</p>
        </div>

        {/* Next steps */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {t("nextSteps")}
          </p>
          <ol className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-xs font-bold text-indigo-600 dark:text-indigo-400">1</span>
              {t("step1")}
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-xs font-bold text-indigo-600 dark:text-indigo-400">2</span>
              {t("step2")}
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-xs font-bold text-indigo-600 dark:text-indigo-400">3</span>
              {t("step3")}
            </li>
          </ol>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={onShare}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition"
          >
            <Share2 size={15} /> {t("shareSuccess")}
          </button>
          {!alreadyWithdrawn && (
            <button
              onClick={onWithdraw}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 hover:bg-green-500 px-4 py-2.5 text-sm font-medium text-white transition"
            >
              <Wallet size={15} /> {t("withdrawFunds")} <ArrowRight size={14} />
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full rounded-xl px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition"
          >
            {t("dismiss")}
          </button>
        </div>
      </div>
    </div>
  );
}
