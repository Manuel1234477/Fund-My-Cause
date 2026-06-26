"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { useBreadcrumb } from "@/context/BreadcrumbContext";
import type { BreadcrumbItem } from "@/context/BreadcrumbContext";

interface BreadcrumbProps {
  /** Override crumbs from context with static ones */
  crumbs?: BreadcrumbItem[];
  /** Show a home icon as the first crumb */
  showHome?: boolean;
  className?: string;
}

export function Breadcrumb({
  crumbs: staticCrumbs,
  showHome = true,
  className = "",
}: BreadcrumbProps) {
  const { crumbs: contextCrumbs } = useBreadcrumb();
  const crumbs = staticCrumbs ?? contextCrumbs;

  const allCrumbs: BreadcrumbItem[] = showHome
    ? [{ label: "Home", href: "/" }, ...crumbs]
    : crumbs;

  if (allCrumbs.length <= 1) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center gap-1 text-sm ${className}`}
    >
      <ol className="flex items-center gap-1 flex-wrap">
        {allCrumbs.map((crumb, index) => {
          const isLast = index === allCrumbs.length - 1;
          return (
            <li key={index} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight
                  size={14}
                  className="text-gray-400 dark:text-gray-600 shrink-0"
                  aria-hidden
                />
              )}
              {isLast || !crumb.href ? (
                <span
                  className={`${
                    isLast
                      ? "text-gray-900 dark:text-white font-medium"
                      : "text-gray-500 dark:text-gray-400"
                  } truncate max-w-[180px]`}
                  aria-current={isLast ? "page" : undefined}
                >
                  {index === 0 && showHome ? (
                    <span className="flex items-center gap-1">
                      <Home size={13} aria-hidden />
                      <span className="sr-only">Home</span>
                    </span>
                  ) : (
                    crumb.label
                  )}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className={`transition hover:text-indigo-600 dark:hover:text-indigo-400 truncate max-w-[180px] ${
                    index === 0 && showHome
                      ? "text-gray-500 dark:text-gray-400"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {index === 0 && showHome ? (
                    <span className="flex items-center gap-1">
                      <Home size={13} aria-hidden />
                      <span className="sr-only">Home</span>
                    </span>
                  ) : (
                    crumb.label
                  )}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
