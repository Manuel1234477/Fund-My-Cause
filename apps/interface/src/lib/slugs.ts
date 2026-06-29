/**
 * Campaign URL slug utilities.
 *
 * Slugs are generated from campaign titles and stored / resolved via a
 * lightweight in-memory registry. In production this would be backed by a
 * database or KV store; here we derive slugs deterministically from the
 * ALL_CAMPAIGNS seed data so the mapping is stable across requests.
 *
 * Slug format: lowercase, hyphens, ASCII-only, max 80 chars.
 * Collisions get a numeric suffix: "clean-water", "clean-water-2", …
 */

import { ALL_CAMPAIGNS } from "@/lib/campaigns";

// ── Core slug generation ───────────────────────────────────────────────────

/**
 * Convert an arbitrary string into a URL-safe slug.
 * e.g. "Eco-Friendly Water Purification!" → "eco-friendly-water-purification"
 */
export function slugify(text: string): string {
  return text
    .normalize("NFD")                        // decompose accented chars
    .replace(/[\u0300-\u036f]/g, "")         // strip combining marks
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")           // keep alphanumerics, spaces, hyphens
    .trim()
    .replace(/[\s-]+/g, "-")                 // collapse spaces/hyphens
    .slice(0, 80)
    .replace(/-+$/, "");                     // trim trailing hyphens
}

// ── Slug ↔ campaign ID registry ────────────────────────────────────────────

export interface SlugEntry {
  slug: string;
  campaignId: string;
}

/**
 * Build a deduplicated slug registry from a list of campaigns.
 * Campaigns with duplicate base slugs receive a numeric suffix.
 */
export function buildSlugRegistry(
  campaigns: { id: string; title: string }[],
): SlugEntry[] {
  const seen = new Map<string, number>(); // base-slug → occurrence count
  const entries: SlugEntry[] = [];

  for (const c of campaigns) {
    const base = slugify(c.title);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);

    const slug = count === 0 ? base : `${base}-${count + 1}`;
    entries.push({ slug, campaignId: c.id });
  }

  return entries;
}

// Singleton registry derived from ALL_CAMPAIGNS (stable across server renders)
let _registry: SlugEntry[] | null = null;

function getRegistry(): SlugEntry[] {
  if (!_registry) {
    _registry = buildSlugRegistry(ALL_CAMPAIGNS);
  }
  return _registry;
}

/**
 * Resolve a slug to a campaign ID.
 * Falls back to treating the input as a raw ID (backward-compatible with
 * existing /campaigns/[id] links).
 *
 * Returns `null` when neither a slug match nor a direct ID match is found.
 */
export function resolveCampaignSlug(slugOrId: string): string | null {
  const registry = getRegistry();

  // 1. Try slug lookup
  const bySlug = registry.find((e) => e.slug === slugOrId);
  if (bySlug) return bySlug.campaignId;

  // 2. Fallback: treat as raw campaign ID
  const byId = ALL_CAMPAIGNS.find((c) => c.id === slugOrId || c.contractId === slugOrId);
  if (byId) return byId.id;

  return null;
}

/**
 * Get the canonical slug for a campaign ID.
 * Returns the ID itself if no slug entry exists.
 */
export function getCampaignSlug(campaignId: string): string {
  const registry = getRegistry();
  return registry.find((e) => e.campaignId === campaignId)?.slug ?? campaignId;
}

/**
 * Returns all slug entries — used by sitemap and generateStaticParams.
 */
export function getAllSlugs(): SlugEntry[] {
  return getRegistry();
}
