/**
 * Feature Flag Configuration
 * 
 * Defines all feature flags used in the application
 */

import { FeatureFlag } from './feature-flags';

/**
 * Feature flag definitions
 */
export const FEATURE_FLAGS: Record<string, FeatureFlag> = {
  // Campaign Features
  CAMPAIGN_CATEGORIES: {
    name: 'campaign_categories',
    enabled: true,
    rolloutPercentage: 100,
    metadata: {
      description: 'Enable campaign categories feature',
      releaseDate: '2026-04-27',
    },
  },

  CAMPAIGN_UPDATES: {
    name: 'campaign_updates',
    enabled: true,
    rolloutPercentage: 100,
    metadata: {
      description: 'Enable campaign updates feature',
      releaseDate: '2026-04-27',
    },
  },

  CAMPAIGN_IMAGE_UPLOAD: {
    name: 'campaign_image_upload',
    enabled: true,
    rolloutPercentage: 100,
    metadata: {
      description: 'Enable campaign image upload feature',
      releaseDate: '2026-04-27',
    },
  },

  // Contribution Features
  RECURRING_CONTRIBUTIONS: {
    name: 'recurring_contributions',
    enabled: true,
    rolloutPercentage: 50,
    metadata: {
      description: 'Enable recurring contribution feature',
      releaseDate: '2026-05-01',
    },
  },

  CONTRIBUTION_MATCHING: {
    name: 'contribution_matching',
    enabled: true,
    rolloutPercentage: 25,
    metadata: {
      description: 'Enable sponsor matching feature',
      releaseDate: '2026-05-15',
    },
  },

  ANONYMOUS_CONTRIBUTIONS: {
    name: 'anonymous_contributions',
    enabled: true,
    rolloutPercentage: 75,
    metadata: {
      description: 'Enable anonymous contribution option',
      releaseDate: '2026-04-27',
    },
  },

  // User Features
  USER_PROFILES: {
    name: 'user_profiles',
    enabled: true,
    rolloutPercentage: 50,
    metadata: {
      description: 'Enable user profile pages',
      releaseDate: '2026-05-01',
    },
  },

  SOCIAL_SHARING: {
    name: 'social_sharing',
    enabled: true,
    rolloutPercentage: 100,
    metadata: {
      description: 'Enable social media sharing',
      releaseDate: '2026-04-27',
    },
  },

  // Admin Features
  CAMPAIGN_ANALYTICS: {
    name: 'campaign_analytics',
    enabled: true,
    rolloutPercentage: 100,
    metadata: {
      description: 'Enable campaign analytics dashboard',
      releaseDate: '2026-04-27',
    },
  },

  ADVANCED_FILTERS: {
    name: 'advanced_filters',
    enabled: true,
    rolloutPercentage: 50,
    metadata: {
      description: 'Enable advanced campaign filters',
      releaseDate: '2026-05-01',
    },
  },

  // Experimental Features
  AI_RECOMMENDATIONS: {
    name: 'ai_recommendations',
    enabled: true,
    rolloutPercentage: 10,
    metadata: {
      description: 'Enable AI-powered campaign recommendations',
      releaseDate: '2026-06-01',
      experimental: true,
    },
  },

  BLOCKCHAIN_VERIFICATION: {
    name: 'blockchain_verification',
    enabled: true,
    rolloutPercentage: 5,
    targetGroups: ['beta_testers'],
    metadata: {
      description: 'Enable blockchain verification badge',
      releaseDate: '2026-06-15',
      experimental: true,
    },
  },

  // Performance Features
  LAZY_LOADING: {
    name: 'lazy_loading',
    enabled: true,
    rolloutPercentage: 100,
    metadata: {
      description: 'Enable lazy loading for campaign lists',
      releaseDate: '2026-04-27',
    },
  },

  IMAGE_OPTIMIZATION: {
    name: 'image_optimization',
    enabled: true,
    rolloutPercentage: 100,
    metadata: {
      description: 'Enable image optimization',
      releaseDate: '2026-04-27',
    },
  },

  // Maintenance Features
  MAINTENANCE_MODE: {
    name: 'maintenance_mode',
    enabled: false,
    rolloutPercentage: 0,
    metadata: {
      description: 'Enable maintenance mode',
      releaseDate: '2026-04-27',
    },
  },

  BETA_FEATURES: {
    name: 'beta_features',
    enabled: true,
    rolloutPercentage: 0,
    targetGroups: ['beta_testers', 'internal'],
    metadata: {
      description: 'Enable beta features for testers',
      releaseDate: '2026-04-27',
    },
  },
};

/**
 * Get all feature flag names
 */
export function getFeatureFlagNames(): string[] {
  return Object.keys(FEATURE_FLAGS);
}

/**
 * Get feature flag by name
 */
export function getFeatureFlag(name: string): FeatureFlag | undefined {
  return FEATURE_FLAGS[name];
}

/**
 * Get all enabled feature flags
 */
export function getEnabledFeatureFlags(): FeatureFlag[] {
  return Object.values(FEATURE_FLAGS).filter((flag) => flag.enabled);
}

/**
 * Get all experimental feature flags
 */
export function getExperimentalFeatureFlags(): FeatureFlag[] {
  return Object.values(FEATURE_FLAGS).filter(
    (flag) => flag.metadata?.experimental === true
  );
}
