"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbContextType {
  crumbs: BreadcrumbItem[];
  setCrumbs: (crumbs: BreadcrumbItem[]) => void;
  pushCrumb: (crumb: BreadcrumbItem) => void;
  popCrumb: () => void;
  clearCrumbs: () => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(
  undefined,
);

export function BreadcrumbProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [crumbs, setCrumbs] = useState<BreadcrumbItem[]>([]);

  const pushCrumb = useCallback((crumb: BreadcrumbItem) => {
    setCrumbs((prev) => [...prev, crumb]);
  }, []);

  const popCrumb = useCallback(() => {
    setCrumbs((prev) => prev.slice(0, -1));
  }, []);

  const clearCrumbs = useCallback(() => setCrumbs([]), []);

  return (
    <BreadcrumbContext.Provider
      value={{ crumbs, setCrumbs, pushCrumb, popCrumb, clearCrumbs }}
    >
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumb() {
  const ctx = useContext(BreadcrumbContext);
  if (!ctx)
    throw new Error("useBreadcrumb must be used within a BreadcrumbProvider");
  return ctx;
}
