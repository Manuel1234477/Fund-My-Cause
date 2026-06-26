const STROOPS_PER_XLM = 10_000_000n;

/** "1,234.56 XLM" — uses locale-aware number formatting */
export function formatXLM(stroops: bigint, locale?: string): string {
  const xlm = Number(stroops) / Number(STROOPS_PER_XLM);
  return `${xlm.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} XLM`;
}

/** "$1,234.56" — uses locale-aware currency formatting */
export function formatUSD(amount: number, locale?: string): string {
  return amount.toLocaleString(locale, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** "GABCD...WXYZ" */
export function formatAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 5)}...${address.slice(-4)}`;
}

/** "Mar 19, 2026" — uses locale-aware date formatting */
export function formatDate(timestamp: number, locale?: string): string {
  return new Date(timestamp * 1000).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** "5d 3h 22m" or "Ended" — caller should use i18n for the "Ended" string */
export function formatTimeLeft(deadline: number): string {
  const diff = deadline * 1000 - Date.now();
  if (diff <= 0) return "Ended";
  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor((diff % 86_400_000) / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

/**
 * Locale-aware XLM amount formatter — returns a plain number string
 * suitable for embedding inside translated strings.
 */
export function formatXLMAmount(stroops: bigint, locale?: string): string {
  const xlm = Number(stroops) / Number(STROOPS_PER_XLM);
  return xlm.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Locale-aware compact number format: "9,300+" → "9.3K" in some locales */
export function formatCompactNumber(value: number, locale?: string): string {
  return new Intl.NumberFormat(locale, {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(value);
}

/** Full locale-aware datetime string */
export function formatDateTime(timestamp: number, locale?: string): string {
  return new Date(timestamp * 1000).toLocaleString(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/** Returns the locale string for a BCP-47 locale code (maps our locale slugs) */
export function localeToIntlCode(locale: string): string {
  const map: Record<string, string> = {
    en: "en-US",
    es: "es-ES",
    fr: "fr-FR",
    de: "de-DE",
    zh: "zh-CN",
    ar: "ar-SA",
    he: "he-IL",
  };
  return map[locale] ?? locale;
}
