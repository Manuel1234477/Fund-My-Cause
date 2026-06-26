"use client";

import React, { useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { CampaignPreview } from "@/components/ui/CampaignPreview";
import type { PreviewData } from "@/components/ui/CampaignPreview";

interface CampaignPreviewModalProps {
  data: PreviewData;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onPublish: () => void;
  publishDisabled?: boolean;
  publishPending?: boolean;
}

export function CampaignPreviewModal({
  data,
  isOpen,
  onClose,
  onEdit,
  onPublish,
  publishDisabled = false,
  publishPending = false,
}: CampaignPreviewModalProps) {
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm overflow-y-auto py-8 px-4"
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
      aria-label="Campaign preview"
    >
      <div className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Campaign Preview
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <CampaignPreview
            data={data}
            onEdit={() => {
              onEdit();
              onClose();
            }}
            onDeploy={onPublish}
            deployDisabled={publishDisabled}
            deployPending={publishPending}
          />
        </div>
      </div>
    </div>
  );
}
