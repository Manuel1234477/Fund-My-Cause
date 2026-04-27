/**
 * Feature Flag Service
 * 
 * Provides a simple in-memory feature flag system for controlling feature rollout.
 * Can be extended to integrate with external services like LaunchDarkly.
 */

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  rolloutPercentage: number; // 0-100
  targetUsers?: string[]; // Specific user IDs to enable for
  targetGroups?: string[]; // User groups to enable for
  metadata?: Record<string, unknown>;
}

export interface FeatureFlagConfig {
  flags: Map<string, FeatureFlag>;
  defaultRolloutPercentage: number;
}

/**
 * Feature Flag Manager
 * Manages feature flags and determines if features should be enabled for users
 */
export class FeatureFlagManager {
  private config: FeatureFlagConfig;

  constructor(defaultRolloutPercentage: number = 0) {
    this.config = {
      flags: new Map(),
      defaultRolloutPercentage,
    };
  }

  /**
   * Register a new feature flag
   */
  registerFlag(flag: FeatureFlag): void {
    this.config.flags.set(flag.name, {
      ...flag,
      rolloutPercentage: flag.rolloutPercentage ?? this.config.defaultRolloutPercentage,
    });
  }

  /**
   * Update an existing feature flag
   */
  updateFlag(name: string, updates: Partial<FeatureFlag>): void {
    const flag = this.config.flags.get(name);
    if (!flag) {
      throw new Error(`Feature flag "${name}" not found`);
    }
    this.config.flags.set(name, { ...flag, ...updates });
  }

  /**
   * Check if a feature is enabled for a user
   */
  isEnabled(
    flagName: string,
    userId?: string,
    userGroups?: string[]
  ): boolean {
    const flag = this.config.flags.get(flagName);
    if (!flag) {
      return false;
    }

    // Feature is globally disabled
    if (!flag.enabled) {
      return false;
    }

    // Check if user is in target users list
    if (flag.targetUsers && userId && flag.targetUsers.includes(userId)) {
      return true;
    }

    // Check if user is in target groups
    if (flag.targetGroups && userGroups) {
      const hasMatchingGroup = flag.targetGroups.some((group) =>
        userGroups.includes(group)
      );
      if (hasMatchingGroup) {
        return true;
      }
    }

    // Check rollout percentage
    if (userId) {
      const hash = this.hashUserId(userId);
      const percentage = (hash % 100) + 1;
      return percentage <= flag.rolloutPercentage;
    }

    // If no userId provided, use rollout percentage
    return flag.rolloutPercentage > 0;
  }

  /**
   * Get all feature flags
   */
  getAllFlags(): FeatureFlag[] {
    return Array.from(this.config.flags.values());
  }

  /**
   * Get a specific feature flag
   */
  getFlag(name: string): FeatureFlag | undefined {
    return this.config.flags.get(name);
  }

  /**
   * Remove a feature flag
   */
  removeFlag(name: string): void {
    this.config.flags.delete(name);
  }

  /**
   * Hash user ID for consistent rollout percentage calculation
   */
  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
}

/**
 * Global feature flag manager instance
 */
let globalFlagManager: FeatureFlagManager | null = null;

/**
 * Initialize the global feature flag manager
 */
export function initializeFeatureFlags(
  defaultRolloutPercentage: number = 0
): FeatureFlagManager {
  globalFlagManager = new FeatureFlagManager(defaultRolloutPercentage);
  return globalFlagManager;
}

/**
 * Get the global feature flag manager
 */
export function getFeatureFlagManager(): FeatureFlagManager {
  if (!globalFlagManager) {
    globalFlagManager = new FeatureFlagManager();
  }
  return globalFlagManager;
}

/**
 * Check if a feature is enabled (convenience function)
 */
export function isFeatureEnabled(
  flagName: string,
  userId?: string,
  userGroups?: string[]
): boolean {
  return getFeatureFlagManager().isEnabled(flagName, userId, userGroups);
}

/**
 * Register a feature flag (convenience function)
 */
export function registerFeatureFlag(flag: FeatureFlag): void {
  getFeatureFlagManager().registerFlag(flag);
}

/**
 * Update a feature flag (convenience function)
 */
export function updateFeatureFlag(
  name: string,
  updates: Partial<FeatureFlag>
): void {
  getFeatureFlagManager().updateFlag(name, updates);
}
