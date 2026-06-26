"use client";

import React from "react";
import { ArrowLeft } from "lucide-react";
import { useBackButton } from "@/hooks/useBackButton";
import type { UseBackButtonOptions } from "@/hooks/useBackButton";

interface BackButtonProps extends UseBackButtonOptions {
  label?: string;
  className?: string;
}

export function BackButton({
  label = "Back",
  fallbackPath = "/",
  confirmMessage,
  className = "",
}: BackButtonProps) {
  const { goBack, canGoBack, confirmOpen, confirmBack, cancelBack } =
    useBackButton({ fallbackPath, confirmMessage });

  return (
    <>
      <button
        type="button"
        onClick={goBack}
        aria-label={canGoBack ? `Go back` : `Go to home`}
        className={`inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition ${className}`}
      >
        <ArrowLeft size={15} aria-hidden />
        {label}
      </button>

      {/* Confirmation dialog */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="back-confirm-title"
          aria-describedby="back-confirm-desc"
        >
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 space-y-4">
            <h2
              id="back-confirm-title"
              className="text-base font-semibold text-gray-900 dark:text-white"
            >
              Leave this page?
            </h2>
            <p
              id="back-confirm-desc"
              className="text-sm text-gray-600 dark:text-gray-400"
            >
              {confirmMessage}
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={cancelBack}
                className="px-4 py-2 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                Stay
              </button>
              <button
                type="button"
                onClick={confirmBack}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
