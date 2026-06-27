export interface Category {
  slug: string;
  label: string;
  emoji: string;
  description: string;
}

export const CATEGORY_TAXONOMY: readonly Category[] = [
  {
    slug: "technology",
    label: "Technology",
    emoji: "💻",
    description: "Software, hardware, and tech innovation projects.",
  },
  {
    slug: "education",
    label: "Education",
    emoji: "📚",
    description: "Learning resources, scholarships, and educational initiatives.",
  },
  {
    slug: "health",
    label: "Health",
    emoji: "❤️",
    description: "Medical research, wellness, and healthcare access.",
  },
  {
    slug: "arts",
    label: "Arts & Culture",
    emoji: "🎨",
    description: "Creative projects, music, film, and visual arts.",
  },
  {
    slug: "environment",
    label: "Environment",
    emoji: "🌱",
    description: "Conservation, sustainability, and climate action.",
  },
  {
    slug: "community",
    label: "Community",
    emoji: "🤝",
    description: "Local initiatives, social causes, and community building.",
  },
  {
    slug: "science",
    label: "Science",
    emoji: "🔬",
    description: "Research, discovery, and scientific advancement.",
  },
  {
    slug: "other",
    label: "Other",
    emoji: "✨",
    description: "Campaigns that don't fit neatly into another category.",
  },
] as const;

export function getCategoryBySlug(slug?: string): Category | undefined {
  if (!slug) return undefined;
  return CATEGORY_TAXONOMY.find((c) => c.slug === slug);
}

export function isValidCategorySlug(slug: string): boolean {
  return CATEGORY_TAXONOMY.some((c) => c.slug === slug);
}

// ── Off-chain metadata (localStorage) ────────────────────────────────────────

export interface CampaignMeta {
  category?: string;
}

function metaKey(contractId: string): string {
  return `fmc:campaign-meta:${contractId}`;
}

export function saveCampaignMeta(contractId: string, meta: CampaignMeta): void {
  try {
    localStorage.setItem(metaKey(contractId), JSON.stringify(meta));
  } catch {
    // localStorage unavailable — silently no-op
  }
}

export function loadCampaignMeta(contractId: string): CampaignMeta {
  try {
    const raw = localStorage.getItem(metaKey(contractId));
    if (!raw) return {};
    return JSON.parse(raw) as CampaignMeta;
  } catch {
    return {};
  }
}
