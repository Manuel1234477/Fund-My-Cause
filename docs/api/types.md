# Contract Types

All `#[contracttype]` definitions used across the crowdfund contract. These types appear in function signatures, storage, and events.

---

## Enums

### `Status`

Campaign lifecycle state machine.

```rust
pub enum Status {
    Active,      // Accepting contributions; normal state
    Successful,  // Goal reached and funds withdrawn by creator
    Refunded,    // Deadline passed, goal not met — refunds available
    Cancelled,   // Creator cancelled — refunds available immediately
    Paused,      // Temporarily halted; no new contributions
    Archived,    // Historical record; campaign has ended
}
```

Valid transitions: `Active → Successful | Refunded | Cancelled | Paused`  
`Paused → Active | Cancelled`

---

### `Category`

```rust
pub enum Category {
    Charity,    // id=0
    Technology, // id=1
    Creative,   // id=2
    Event,      // id=3
    Personal,   // id=4
    Other,      // id=5
}
```

Category `id` values are used by the registry contract's `register_with_category` and `get_campaigns_by_category`.

---

### `Visibility`

```rust
pub enum Visibility {
    Public,   // Listed in discovery; anyone may contribute
    Private,  // Whitelist-only; not listed in discovery
    Unlisted, // Anyone may contribute; not listed in discovery
}
```

---

### `TemplateType`

```rust
pub enum TemplateType {
    Charity,
    Product,
    Event,
    Personal,
    Custom,
}
```

Used by `initialize_from_template` to apply pre-configured defaults.

---

### `MilestoneStatus`

```rust
pub enum MilestoneStatus {
    Pending,
    Reached,
    Verified,
}
```

---

## Structs

### `CampaignStats`

Returned by `get_stats`. Snapshot of current campaign metrics.

```rust
pub struct CampaignStats {
    pub total_raised: i128,          // Total raised in stroops
    pub goal: i128,                  // Funding goal in stroops
    pub progress_bps: u32,           // Progress 0–10 000 (10 000 = 100%)
    pub contributor_count: u32,      // Unique contributor addresses
    pub average_contribution: i128,  // total_raised / contributor_count
    pub largest_contribution: i128,  // Largest single cumulative total
}
```

`progress_bps = total_raised * 10_000 / goal` — note this can exceed 10 000 if matching pushes the total over the goal.

---

### `CampaignInfo`

Returned by `get_campaign_info`. Full metadata snapshot.

```rust
pub struct CampaignInfo {
    pub creator: Address,
    pub token: Address,
    pub goal: i128,
    pub deadline: u64,           // Unix timestamp (seconds)
    pub min_contribution: i128,
    pub max_contribution: i128,  // 0 = no per-contributor cap
    pub title: String,
    pub description: String,
    pub status: Status,
    pub has_platform_config: bool,
    pub platform_fee_bps: u32,   // 0 if no platform config
    pub platform_address: Address,
    pub category: Category,
}
```

---

### `PlatformConfig`

```rust
pub struct PlatformConfig {
    pub address: Address, // Fee recipient
    pub fee_bps: u32,     // Fee in basis points (max 10 000 = 100%)
}
```

Fee calculation: `fee = total_raised * fee_bps / 10_000`

---

### `MatchingConfig`

```rust
pub struct MatchingConfig {
    pub sponsor: Address,
    pub match_ratio: u32, // Basis points (10 000 = 1:1 match, 5 000 = 0.5:1)
    pub max_match: i128,  // Total matching cap in stroops
}
```

Per-contribution match: `matched = effective_amount * match_ratio / 10_000`, capped at remaining pool.

---

### `VestingSchedule`

```rust
pub struct VestingSchedule {
    pub cliff: u64,    // No withdrawal before this Unix timestamp
    pub duration: u64, // Linear vesting period in seconds after cliff
}
```

Vested amount at time `t`: `payout * min(t - cliff, duration) / duration`

---

### `RateLimit`

```rust
pub struct RateLimit {
    pub max_amount: i128,    // Max stroops per address per window
    pub window_seconds: u64, // Rolling window length in seconds
}
```

---

### `InsuranceConfig`

```rust
pub struct InsuranceConfig {
    pub fee_bps: u32,      // Insurance fee in basis points
    pub provider: Address, // Insurance provider address
    pub enabled: bool,
}
```

When enabled, `fee = amount * fee_bps / 10_000` is deducted from each contribution and held in the insurance pool.

---

### `RecurringPlan`

```rust
pub struct RecurringPlan {
    pub amount: i128,       // Amount per execution in stroops
    pub interval: u64,      // Seconds between contributions
    pub end_date: u64,      // Unix timestamp to stop executing
    pub last_executed: u64, // Timestamp of last successful execution
}
```

---

### `RewardTier`

```rust
pub struct RewardTier {
    pub min_amount: i128, // Minimum cumulative contribution to qualify
    pub name: String,     // e.g. "Bronze", "Silver", "Gold"
    pub description: String,
}
```

Tiers must be stored sorted ascending by `min_amount`. Assigned automatically on each contribution.

---

### `RewardConfig`

```rust
pub struct RewardConfig {
    pub reward_token: Address,
    pub reward_per_unit: i128, // Reward tokens per stroop contributed
    pub enabled: bool,
}
```

---

### `ContributionRecord`

```rust
pub struct ContributionRecord {
    pub amount: i128,        // This contribution in stroops
    pub timestamp: u64,      // Ledger timestamp at contribution
    pub running_total: i128, // Cumulative total after this contribution
}
```

Stored in `ContributionHistory(Address)` persistent storage.

---

### `Milestone`

```rust
pub struct Milestone {
    pub amount: i128,       // Target amount in stroops
    pub description: String,
    pub reached: bool,
}
```

---

### `Delegation`

```rust
pub struct Delegation {
    pub delegate: Address, // Address authorised to contribute on behalf
    pub amount: i128,      // Maximum amount the delegate may contribute
}
```

---

### `PerformanceMetrics`

Returned by `get_performance_metrics`.

```rust
pub struct PerformanceMetrics {
    pub success_rate_bps: u32,
    pub contribution_velocity: i128,   // Stroops raised per day
    pub trending: i32,                 // Positive = accelerating
    pub milestones_reached: u32,
    pub total_milestones: u32,
    pub time_elapsed: u64,             // Seconds since campaign start
    pub estimated_time_to_goal: u64,   // Seconds until goal at current velocity
    pub average_daily_contribution: i128,
}
```
