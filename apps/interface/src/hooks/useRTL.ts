"use client";

import { useLocale } from "next-intl";
import { rtlLocales, type Locale } from "@/i18n/config";

export function useRTL(): boolean {
  const locale = useLocale() as Locale;
  return rtlLocales.includes(locale);
}

export function useDir(): "ltr" | "rtl" {
  return useRTL() ? "rtl" : "ltr";
}
