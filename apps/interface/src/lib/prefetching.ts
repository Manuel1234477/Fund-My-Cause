/**
 * Prefetching utilities for links and data.
 * Preloads resources before user interaction.
 */

const prefetchedData = new Map<string, unknown>();
const prefetchedLinks = new Set<string>();

/**
 * Prefetch data from an endpoint.
 */
export async function prefetchData(
  endpoint: string,
  params?: Record<string, unknown>,
): Promise<void> {
  const key = `${endpoint}:${JSON.stringify(params || {})}`;

  if (prefetchedData.has(key)) {
    return;
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params || {}),
    });
    const data = await response.json();
    prefetchedData.set(key, data);
  } catch (error) {
    console.warn(`Failed to prefetch ${endpoint}:`, error);
  }
}

/**
 * Get prefetched data.
 */
export function getPrefetchedData(
  endpoint: string,
  params?: Record<string, unknown>,
): unknown | undefined {
  const key = `${endpoint}:${JSON.stringify(params || {})}`;
  return prefetchedData.get(key);
}

/**
 * Prefetch a link resource.
 */
export function prefetchLink(href: string): void {
  if (prefetchedLinks.has(href)) {
    return;
  }

  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = href;
  document.head.appendChild(link);
  prefetchedLinks.add(href);
}

/**
 * Add resource hints to the document head.
 */
export function addResourceHints(urls: string[]): void {
  urls.forEach((url) => {
    const link = document.createElement("link");
    link.rel = "dns-prefetch";
    link.href = url;
    document.head.appendChild(link);
  });
}

/**
 * Prefetch multiple links on hover/focus.
 */
export function setupLinkPrefetching(selector: string): void {
  const links = document.querySelectorAll<HTMLAnchorElement>(selector);

  links.forEach((link) => {
    link.addEventListener("mouseenter", () => {
      const href = link.getAttribute("href");
      if (href) prefetchLink(href);
    });

    link.addEventListener("focus", () => {
      const href = link.getAttribute("href");
      if (href) prefetchLink(href);
    });
  });
}

/**
 * Clear all prefetched data.
 */
export function clearPrefetchCache(): void {
  prefetchedData.clear();
  prefetchedLinks.clear();
}

/**
 * Get prefetch stats.
 */
export function getPrefetchStats() {
  return {
    prefetchedDataCount: prefetchedData.size,
    prefetchedLinksCount: prefetchedLinks.size,
  };
}
