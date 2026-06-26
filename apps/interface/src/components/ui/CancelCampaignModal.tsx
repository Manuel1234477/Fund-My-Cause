"use client";

import React, { useState } from "react";
import { X, AlertTriangle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface CancelCampaignModalProps {
  campaignTitle: string;
  onClose: () => void;
  /** Called with the reason string when the user confirms. Should throw on error. */
  onConfirm: (reason: string) => Promise<void>;
}

export function CancelCampaignModal({
  campaignTitle,
  onClose,
  onConfirm,
}: CancelCampaignModalProps) {
  const t = useTranslations("cancelCampaign");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!reason.trim()) {
      setError(t("validationReason"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onConfirm(reason.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cancellation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      onClick={(e) => e.target === e.currentTarget && !loading && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-modal-title"
        className="w-full max-w-sm space-y-5 rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-900/40">
              <AlertTriangle size={18} className="text-red-400" />
            </div>
            <div>
              <h2 id="cancel-modal-title" className="font-semibold text-white">
                {t("title")}
              </h2>
              <p className="mt-0.5 text-xs text-gray-400 line-clamp-1">{campaignTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            aria-label={t("close")}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-800 transition disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        {/* Warning */}
        <p
          className="text-sm text-gray-300"
          dangerouslySetInnerHTML={{
            __html: t.raw("irreversibleWarning") as string,
          }}
        />

        {/* Reason input */}
        <div>
          <label htmlFor="cancel-reason" className="mb-1.5 block text-sm text-gray-400">
            {t("reasonLabel")} <span className="text-red-400">*</span>
          </label>
          <textarea
            id="cancel-reason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={loading}
            placeholder={t("reasonPlaceholder")}
            className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-white placeholder-gray-500 focus:border-red-500 focus:outline-none disabled:opacity-50"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-xl px-4 py-2 text-sm text-gray-400 hover:text-white transition disabled:opacity-50"
          >
            {t("cancelButton")}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-700 hover:bg-red-600 px-4 py-2 text-sm font-medium text-white transition disabled:opacity-50 aria-disabled:opacity-50"
            aria-disabled={!reason.trim() || loading}
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {t("confirmButton")}
          </button>
        </div>
      </div>
    </div>
  );
}
