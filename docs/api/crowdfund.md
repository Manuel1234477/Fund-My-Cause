# Crowdfund Contract API

**Source:** `contracts/crowdfund/src/lib.rs`  
**Types:** [types.md](./types.md) · **Errors:** [errors.md](./errors.md) · **Events:** [events.md](./events.md)

---

## Core lifecycle

### `initialize`

Deploys a new campaign. Can only be called once per contract instance.

```rust
pub fn initialize(
    env: Env,
    creator: Address,                          // ✦ auth required
    token: Address,                            // primary contribution token
    goal: i128,                                // stroops, > 0
    deadline: u64,                             // Unix timestamp, > now
    min_contribution: i128,                    // stroops, >= 0
    max_contribution: i128,                    // 0 = no cap
    title: String,                             // 1–64 chars
    description: String,                       // 1–512 chars
    social_links: Option<Vec<String>>,
    platform_config: Option<PlatformConfig>,
    accepted_tokens: Option<Vec<Address>>,
    category: Category,
    vesting: Option<VestingSchedule>,
    penalty_bps: Option<u32>,
) -> Result<(), ContractError>
```

**Errors:** `AlreadyInitialized` · `InvalidGoal` · `InvalidDeadline` · `InvalidFee` · `SelfFeeAddress` · `GoalOverflow` · `StringEmpty` · `StringTooLong`  
**Events:** `initialized`

```ts
// JavaScript — via Stellar SDK invokeContract helper
await invokeContract(creator, contractId, "initialize", [
  nativeToScVal(creator,      { type: "address" }),
  nativeToScVal(token,        { type: "address" }),
  nativeToScVal(1_000_000_000n, { type: "i128" }),    // 100 XLM goal
  nativeToScVal(1_800_000_000n, { type: "u64"  }),    // deadline
  nativeToScVal(10_000_000n,    { type: "i128" }),    // 1 XLM min
  nativeToScVal(0n,             { type: "i128" }),    // no cap
  nativeToScVal("Help us build something great", { type: "string" }),
  nativeToScVal("Full description here...",      { type: "string" }),
  xdr.ScVal.scvVoid(),  // no social links
  xdr.ScVal.scvVoid(),  // no platform config
  xdr.ScVal.scvVoid(),  // accept all tokens
  nativeToScVal({ Technology: {} }),                  // category
  xdr.ScVal.scvVoid(),  // no vesting
  xdr.ScVal.scvVoid(),  // no penalty
], signTx);
```

---

### `contribute`

Pledges tokens before the campaign deadline.

```rust
pub fn contribute(
    env: Env,
    contributor: Address,    // ✦ auth required
    amount: i128,            // >= min_contribution
    token: Address,          // must be in accepted_tokens
    message: Option<String>, // optional memo, max 256 chars
) -> Result<(), ContractError>
```

**Errors:** `NotActive` · `CampaignPaused` · `CampaignEnded` · `BelowMinimum` · `ExceedsMaximum` · `TokenNotAccepted` · `NotWhitelisted` · `Blacklisted` · `RateLimitExceeded` · `MessageTooLong` · `Overflow`  
**Events:** `contributed` · `contribution_recorded` · (optionally) `tier_assigned` · `rate_limit_hit`

If `MatchingConfig` is set, the matched amount is added to `total_raised` automatically and deducted from the sponsor's escrow pool.

```ts
await invokeContract(contributor, contractId, "contribute", [
  new Address(contributor).toScVal(),
  nativeToScVal(50_000_000n, { type: "i128" }), // 5 XLM
  new Address(xlmTokenId).toScVal(),
  xdr.ScVal.scvVoid(),                          // no message
], signTx);
```

---

### `withdraw`

Creator claims funds after the campaign succeeds (deadline passed + goal met).

```rust
pub fn withdraw(env: Env) -> Result<(), ContractError>
```

**Auth:** creator  
**Errors:** `NotActive` · `CampaignStillActive` · `GoalNotReached` · `VestingNotComplete`  
**Events:** `withdrawn` · (if matching) `matching_sponsor_refunded`

Platform fee is deducted automatically: `fee = total * fee_bps / 10_000`.  
Any unused matching pool balance is returned to the sponsor in the same transaction.

---

### `refund_single`

Contributor reclaims their funds after a failed or cancelled campaign.

```rust
pub fn refund_single(env: Env, contributor: Address) -> Result<(), ContractError>
```

**Errors:** `GoalReached` · `CampaignStillActive`  
**Events:** `refunded`

Pull-based model — each contributor calls individually. Safe to retry; calling with zero balance is a no-op.

---

### `refund_batch`

Batch refund up to N contributors in one transaction.

```rust
pub fn refund_batch(env: Env, contributors: Vec<Address>) -> Result<u32, ContractError>
```

**Returns:** number of addresses successfully refunded  
**Events:** `batch_refund_completed`

---

### `refund_partial`

Contributor withdraws up to 50% of their pledge before the deadline ends.

```rust
pub fn refund_partial(
    env: Env,
    contributor: Address, // ✦ auth required
    amount: i128,
    reason: String,
) -> Result<(), ContractError>
```

**Errors:** `RefundLimitExceeded` · `NotActive` · `CampaignEnded`  
**Events:** `partial_refund`

---

### `cancel_campaign`

Creator cancels the campaign; all contributors may then claim refunds immediately.

```rust
pub fn cancel_campaign(env: Env) -> Result<(), ContractError>
```

**Auth:** creator  
**Events:** `cancelled` · `status_changed`

---

## Metadata & configuration

### `update_metadata`

Update title, description, or social links. Versioned for audit history.

```rust
pub fn update_metadata(
    env: Env,
    title: Option<String>,
    description: Option<String>,
    social_links: Option<Vec<String>>,
) -> Result<(), ContractError>
```

Pass `None` for any field to leave it unchanged.

---

### `extend_deadline` / `adjust_goal` / `update_category` / `set_visibility`

```rust
pub fn extend_deadline(env: Env, new_deadline: u64) -> Result<(), ContractError>
pub fn adjust_goal(env: Env, new_goal: i128) -> Result<(), ContractError>
pub fn update_category(env: Env, category: Category) -> Result<(), ContractError>
pub fn set_visibility(env: Env, visibility: Visibility) -> Result<(), ContractError>
```

All require creator auth; all only work in `Active` status.

---

### `pause` / `resume` / `unpause`

```rust
pub fn pause(env: Env) -> Result<(), ContractError>
pub fn resume(env: Env) -> Result<(), ContractError>
pub fn unpause(env: Env) -> Result<(), ContractError>
```

`pause` → status `Paused`. `resume`/`unpause` → back to `Active`.

---

## Access control

### Rate limiting

```rust
pub fn set_rate_limit(env: Env, rate_limit: Option<RateLimit>) -> Result<(), ContractError>
pub fn get_rate_limit(env: Env) -> Option<RateLimit>
```

Pass `None` to `set_rate_limit` to clear the rate limit.

```ts
// Cap each address to 10 XLM per hour
await invokeContract(creator, contractId, "set_rate_limit", [
  nativeToScVal({ max_amount: 100_000_000n, window_seconds: 3600n }),
], signTx);
```

### Whitelist / blacklist

```rust
pub fn add_to_whitelist(env: Env, address: Address) -> Result<(), ContractError>
pub fn remove_from_whitelist(env: Env, address: Address) -> Result<(), ContractError>
pub fn set_whitelist_only(env: Env, enabled: bool) -> Result<(), ContractError>
pub fn is_whitelisted(env: Env, address: Address) -> bool

pub fn add_to_blacklist(env: Env, address: Address) -> Result<(), ContractError>
pub fn remove_from_blacklist(env: Env, address: Address) -> Result<(), ContractError>
pub fn is_blacklisted(env: Env, address: Address) -> bool
```

---

## Donation matching

### `setup_matching`

Sponsor escrows `max_match` tokens into the contract to fund a matching pool.

```rust
pub fn setup_matching(
    env: Env,
    sponsor: Address, // ✦ auth required (also requires creator auth)
    match_ratio: u32, // basis points — 10 000 = 1:1, 5 000 = 0.5:1
    max_match: i128,  // total matching cap in stroops
) -> Result<(), ContractError>
```

**Events:** `matching_setup`

On each `contribute`, the matched amount is computed as `effective_amount * match_ratio / 10_000` and added to `total_raised` (capped at remaining pool). The pool is deducted accordingly.

On `withdraw`, any unused pool balance is automatically refunded to the sponsor.

### `refund_matching_sponsor`

Manual sponsor refund after cancellation.

```rust
pub fn refund_matching_sponsor(env: Env) -> Result<(), ContractError>
```

**Auth:** creator  
**Events:** `matching_sponsor_refunded`

### Read functions

```rust
pub fn get_matching_config(env: Env) -> Option<MatchingConfig>
pub fn get_total_matched(env: Env) -> i128
pub fn get_matching_pool(env: Env) -> i128  // remaining unspent pool
```

---

## Recurring contributions

```rust
pub fn setup_recurring(
    env: Env,
    contributor: Address, // ✦ auth required
    amount: i128,
    interval: u64,  // seconds between contributions
    end_date: u64,  // Unix timestamp to stop
) -> Result<(), ContractError>

pub fn execute_recurring(env: Env, contributor: Address) -> Result<(), ContractError>
pub fn cancel_recurring(env: Env, contributor: Address) -> Result<(), ContractError>
pub fn get_recurring_plan(env: Env, contributor: Address) -> Option<RecurringPlan>
```

`execute_recurring` is permissionless — anyone may call it to trigger a pending recurring contribution.

---

## Delegation

```rust
pub fn delegate_contribution(
    env: Env,
    delegator: Address, // ✦ auth required
    delegate: Address,
    amount: i128,
) -> Result<(), ContractError>

pub fn contribute_on_behalf(
    env: Env,
    delegate: Address,  // ✦ auth required
    delegator: Address,
    amount: i128,
    token: Address,
) -> Result<(), ContractError>

pub fn revoke_delegation(env: Env, delegator: Address) -> Result<(), ContractError>
pub fn get_delegation(env: Env, delegator: Address) -> Option<Delegation>
```

---

## Extension voting

```rust
pub fn propose_extension(env: Env, new_deadline: u64) -> Result<(), ContractError>
pub fn vote_on_extension(
    env: Env,
    contributor: Address, // ✦ auth required
    approve: bool,
) -> Result<(), ContractError>
pub fn execute_extension(env: Env) -> Result<(), ContractError>
pub fn get_extension_proposal(env: Env) -> Option<ExtensionProposal>
```

Vote weight is proportional to `contribution(voter)`. Proposal passes when `approve_weight > total_voted_weight / 2`.

---

## Reward tiers

```rust
pub fn set_reward_tiers(env: Env, tiers: Vec<RewardTier>) -> Result<(), ContractError>
pub fn get_tier_for_amount(env: Env, amount: i128) -> Option<RewardTier>
pub fn get_contributor_tier(env: Env, contributor: Address) -> Option<RewardTier>
pub fn configure_rewards(env: Env, reward_token: Address, reward_per_unit: i128) -> Result<(), ContractError>
pub fn distribute_rewards(env: Env, contributor: Address) -> Result<(), ContractError>
```

---

## Emergency withdrawal

```rust
pub fn initiate_emergency_withdrawal(env: Env, lock_period: u64) -> Result<(), ContractError>
pub fn setup_emergency_multisig(
    env: Env,
    approvers: Vec<Address>,
    required_approvals: u32,
) -> Result<(), ContractError>
pub fn approve_emergency_withdrawal(env: Env, approver: Address) -> Result<(), ContractError>
pub fn execute_emergency_withdrawal(env: Env) -> Result<(), ContractError>
pub fn cancel_emergency_withdrawal(env: Env) -> Result<(), ContractError>
```

---

## Insurance

```rust
pub fn enable_insurance(
    env: Env,
    fee_bps: u32,
    provider: Address,
) -> Result<(), ContractError>
pub fn get_insurance_config(env: Env) -> Option<InsuranceConfig>
pub fn get_insurance_pool(env: Env) -> i128
pub fn get_insurance_fee(env: Env, contributor: Address) -> i128
pub fn claim_insurance_payout(env: Env, contributor: Address) -> Result<(), ContractError>
```

---

## Templates & cloning

```rust
pub fn initialize_from_template(
    env: Env,
    creator: Address,
    token: Address,
    goal: i128,
    deadline: u64,
    title: String,
    description: String,
    template_type: TemplateType,
) -> Result<(), ContractError>

pub fn clone_campaign(
    env: Env,
    new_creator: Address,
    new_goal: i128,
    new_deadline: u64,
) -> Result<(), ContractError>
```

---

## Read-only functions (view)

No auth required. Safe to call with a dummy account via `simulateTransaction`.

| Function | Returns | Description |
|----------|---------|-------------|
| `get_stats()` | `CampaignStats` | Live funding metrics |
| `get_campaign_info()` | `CampaignInfo` | Full metadata snapshot |
| `get_performance_metrics()` | `PerformanceMetrics` | Velocity, trending, estimated completion |
| `total_raised()` | `i128` | Total raised in stroops |
| `goal()` | `i128` | Funding goal in stroops |
| `deadline()` | `u64` | Deadline Unix timestamp |
| `contribution(addr)` | `i128` | Cumulative contribution for address |
| `min_contribution()` | `i128` | Minimum per contribution |
| `max_contribution()` | `i128` | Per-contributor cap (0 = none) |
| `title()` | `String` | Campaign title |
| `description()` | `String` | Campaign description |
| `social_links()` | `Vec<String>` | Social URLs |
| `creator()` | `Address` | Campaign creator address |
| `status()` | `Status` | Current status |
| `get_category()` | `Category` | Campaign category |
| `version()` | `u32` | Contract version (currently `4`) |
| `is_contributor(addr)` | `bool` | Whether address has contributed |
| `is_whitelisted(addr)` | `bool` | Whitelist membership |
| `is_blacklisted(addr)` | `bool` | Blacklist membership |
| `contributor_list(offset, limit)` | `Vec<Address>` | Paginated contributor addresses |
| `get_contribution_history(addr)` | `Vec<ContributionRecord>` | Per-contributor history |
| `get_contributor_tier(addr)` | `Option<RewardTier>` | Current reward tier |
| `get_vesting_info()` | `Option<VestingSchedule>` | Vesting config |
| `get_matching_config()` | `Option<MatchingConfig>` | Matching config |
| `get_total_matched()` | `i128` | Total matched so far |
| `get_matching_pool()` | `i128` | Remaining unspent matching pool |
| `get_rate_limit()` | `Option<RateLimit>` | Rate limit config |
| `get_delegation(addr)` | `Option<Delegation>` | Active delegation |
| `get_recurring_plan(addr)` | `Option<RecurringPlan>` | Recurring plan |
| `get_extension_proposal()` | `Option<ExtensionProposal>` | Active extension proposal |
| `get_goal_history()` | `Vec<GoalAdjustment>` | Goal change history |
| `get_metadata_history()` | `Vec<MetadataVersion>` | Metadata version history |
