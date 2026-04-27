# Feature Flag System

The Fund-My-Cause application includes a comprehensive feature flag system for controlling feature rollout and A/B testing.

## Overview

The feature flag system provides:
- **Gradual Rollout**: Control feature availability by percentage
- **User Targeting**: Enable features for specific users or groups
- **A/B Testing**: Test features with different user segments
- **Easy Management**: Simple UI for managing flags
- **Type-Safe**: Full TypeScript support

## Quick Start

### 1. Initialize Feature Flags

In your app's root component:

```tsx
import { FeatureFlagProvider, initializeFeatureFlags } from '@/lib/use-feature-flags';
import { FEATURE_FLAGS } from '@/lib/feature-flag-config';

// Initialize with all flags
const manager = initializeFeatureFlags();
Object.values(FEATURE_FLAGS).forEach(flag => {
  manager.registerFlag(flag);
});

export default function App() {
  return (
    <FeatureFlagProvider userId={userId} userGroups={userGroups}>
      {/* Your app content */}
    </FeatureFlagProvider>
  );
}
```

### 2. Use Feature Flags in Components

```tsx
import { useFeatureFlag, FeatureFlag } from '@/lib/use-feature-flags';

export function CampaignCard() {
  const hasCategories = useFeatureFlag('campaign_categories');
  const hasImageUpload = useFeatureFlag('campaign_image_upload');

  return (
    <div>
      {hasCategories && <CategorySelector />}
      {hasImageUpload && <ImageUploader />}
    </div>
  );
}
```

### 3. Conditional Rendering

```tsx
import { FeatureFlag } from '@/lib/use-feature-flags';

export function Dashboard() {
  return (
    <>
      <FeatureFlag name="campaign_analytics">
        <AnalyticsDashboard />
      </FeatureFlag>

      <FeatureFlag name="advanced_filters" fallback={<BasicFilters />}>
        <AdvancedFilters />
      </FeatureFlag>
    </>
  );
}
```

## Feature Flag Configuration

Feature flags are defined in `src/lib/feature-flag-config.ts`:

```typescript
export const FEATURE_FLAGS: Record<string, FeatureFlag> = {
  CAMPAIGN_CATEGORIES: {
    name: 'campaign_categories',
    enabled: true,
    rolloutPercentage: 100,
    metadata: {
      description: 'Enable campaign categories feature',
      releaseDate: '2026-04-27',
    },
  },
  // ... more flags
};
```

### Flag Properties

- **name**: Unique identifier for the flag
- **enabled**: Global on/off switch
- **rolloutPercentage**: Percentage of users to enable for (0-100)
- **targetUsers**: Specific user IDs to enable for
- **targetGroups**: User groups to enable for (e.g., 'beta_testers')
- **metadata**: Additional information (description, release date, etc.)

## Rollout Strategies

### Percentage-Based Rollout

Enable a feature for a percentage of users:

```typescript
{
  name: 'new_feature',
  enabled: true,
  rolloutPercentage: 25, // 25% of users
}
```

The system uses consistent hashing based on user ID to ensure the same user always gets the same experience.

### User Targeting

Enable for specific users:

```typescript
{
  name: 'beta_feature',
  enabled: true,
  rolloutPercentage: 0,
  targetUsers: ['user123', 'user456'],
}
```

### Group Targeting

Enable for user groups:

```typescript
{
  name: 'admin_feature',
  enabled: true,
  rolloutPercentage: 0,
  targetGroups: ['admins', 'moderators'],
}
```

### Combined Strategies

Combine multiple strategies:

```typescript
{
  name: 'premium_feature',
  enabled: true,
  rolloutPercentage: 50,
  targetUsers: ['vip_user1'],
  targetGroups: ['premium_members'],
}
```

## Management UI

Access the feature flag management UI at `/admin/feature-flags`:

```tsx
import { FeatureFlagManagerUI } from '@/components/FeatureFlagManager';

export function AdminPage() {
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <FeatureFlagManagerUI />
    </div>
  );
}
```

The UI allows you to:
- View all feature flags
- Toggle flags on/off
- Adjust rollout percentages
- View flag metadata

## API Reference

### Hooks

#### `useFeatureFlag(flagName: string): boolean`

Check if a feature is enabled:

```tsx
const isEnabled = useFeatureFlag('campaign_categories');
```

#### `useFeatureFlagConfig(flagName: string): FeatureFlag | undefined`

Get the full flag configuration:

```tsx
const flag = useFeatureFlagConfig('campaign_categories');
console.log(flag?.rolloutPercentage);
```

#### `useAllFeatureFlags(): FeatureFlag[]`

Get all feature flags:

```tsx
const flags = useAllFeatureFlags();
```

#### `useRegisterFeatureFlag(flag: FeatureFlag): void`

Register a new feature flag:

```tsx
useRegisterFeatureFlag({
  name: 'new_feature',
  enabled: true,
  rolloutPercentage: 50,
});
```

#### `useUpdateFeatureFlag(name: string, updates: Partial<FeatureFlag>): () => void`

Update a feature flag:

```tsx
const updateFlag = useUpdateFeatureFlag('campaign_categories', {
  rolloutPercentage: 75,
});
updateFlag();
```

### Functions

#### `isFeatureEnabled(flagName: string, userId?: string, userGroups?: string[]): boolean`

Check if a feature is enabled (outside React):

```typescript
if (isFeatureEnabled('campaign_categories', userId, userGroups)) {
  // Feature is enabled
}
```

#### `registerFeatureFlag(flag: FeatureFlag): void`

Register a feature flag (outside React):

```typescript
registerFeatureFlag({
  name: 'new_feature',
  enabled: true,
  rolloutPercentage: 50,
});
```

#### `updateFeatureFlag(name: string, updates: Partial<FeatureFlag>): void`

Update a feature flag (outside React):

```typescript
updateFeatureFlag('campaign_categories', {
  rolloutPercentage: 75,
});
```

## Best Practices

### 1. Naming Conventions

Use clear, descriptive names:

```typescript
// Good
'campaign_categories'
'recurring_contributions'
'ai_recommendations'

// Avoid
'feature1'
'new_thing'
'test'
```

### 2. Gradual Rollout

Start with a small percentage and increase:

```typescript
// Day 1: 5% of users
rolloutPercentage: 5

// Day 3: 25% of users
rolloutPercentage: 25

// Day 7: 100% of users
rolloutPercentage: 100
```

### 3. Monitoring

Monitor feature usage and errors:

```tsx
export function useFeatureFlagWithTracking(flagName: string) {
  const isEnabled = useFeatureFlag(flagName);
  
  useEffect(() => {
    if (isEnabled) {
      trackEvent('feature_enabled', { flag: flagName });
    }
  }, [isEnabled, flagName]);
  
  return isEnabled;
}
```

### 4. Cleanup

Remove flags after full rollout:

```typescript
// After 100% rollout for 2 weeks, remove the flag
// and make the feature permanent
```

### 5. Documentation

Document why each flag exists:

```typescript
{
  name: 'ai_recommendations',
  enabled: true,
  rolloutPercentage: 10,
  metadata: {
    description: 'AI-powered campaign recommendations',
    releaseDate: '2026-06-01',
    experimental: true,
    issue: 'https://github.com/Fund-My-Cause/Fund-My-Cause/issues/123',
  },
}
```

## Integration with External Services

### LaunchDarkly Integration

To integrate with LaunchDarkly:

```typescript
import * as LaunchDarkly from '@launchdarkly/js-client-sdk';

const ldClient = LaunchDarkly.initialize(
  'YOUR_CLIENT_ID',
  { key: userId }
);

export function useFeatureFlagLD(flagName: string): boolean {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    ldClient.on('ready', () => {
      setIsEnabled(ldClient.variation(flagName, false));
    });
  }, [flagName]);

  return isEnabled;
}
```

### Custom Backend Integration

To fetch flags from your backend:

```typescript
export async function fetchFeatureFlags(userId: string) {
  const response = await fetch(`/api/feature-flags?userId=${userId}`);
  const flags = await response.json();
  
  flags.forEach(flag => {
    registerFeatureFlag(flag);
  });
}
```

## Troubleshooting

### Feature Not Showing

1. Check if flag is enabled: `flag.enabled === true`
2. Check rollout percentage: `flag.rolloutPercentage > 0`
3. Check user targeting: Is user in `targetUsers` or `targetGroups`?
4. Check provider setup: Is `FeatureFlagProvider` wrapping your component?

### Inconsistent Behavior

Feature flags use consistent hashing based on user ID. If a user sees different behavior:

1. Verify user ID is consistent
2. Check if flag was updated recently
3. Clear browser cache
4. Check browser console for errors

## Examples

### A/B Testing

```tsx
export function CampaignForm() {
  const useNewDesign = useFeatureFlag('new_campaign_form_design');

  return useNewDesign ? <NewCampaignForm /> : <LegacyCampaignForm />;
}
```

### Gradual Feature Release

```tsx
export function Dashboard() {
  const hasAnalytics = useFeatureFlag('campaign_analytics');
  const hasAdvancedFilters = useFeatureFlag('advanced_filters');

  return (
    <div>
      {hasAnalytics && <AnalyticsDashboard />}
      {hasAdvancedFilters && <AdvancedFilters />}
    </div>
  );
}
```

### Beta Testing

```tsx
export function BetaFeatures() {
  const isBetaTester = useFeatureFlag('beta_features');

  if (!isBetaTester) {
    return <div>This feature is not available yet</div>;
  }

  return <ExperimentalFeature />;
}
```

## Support

For issues or questions about feature flags:
1. Check the troubleshooting section above
2. Review the feature flag configuration
3. Check browser console for errors
4. Contact the development team
