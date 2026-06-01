# Detailed Architecture Documentation

Comprehensive guide to Fund-My-Cause system design, component interactions, and data flows.

## Table of Contents

- [System Architecture](#system-architecture)
- [Component Diagrams](#component-diagrams)
- [Data Flow Diagrams](#data-flow-diagrams)
- [Sequence Diagrams](#sequence-diagrams)
- [Design Decisions](#design-decisions)
- [Security Architecture](#security-architecture)

---

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Components  │  │    Hooks     │  │   Context    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└────────────────────────┬────────────────────────────────────┘
                         │
                    Freighter Wallet
                         │
┌────────────────────────┴────────────────────────────────────┐
│              Stellar Network (Testnet/Mainnet)              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Soroban Smart Contracts (Rust)               │   │
│  │  ┌──────────────────┐  ┌──────────────────┐         │   │
│  │  │ Crowdfund        │  │ Registry         │         │   │
│  │  │ Contract         │  │ Contract         │         │   │
│  │  └──────────────────┘  └──────────────────┘         │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Token Contracts (XLM, Custom)                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Layers

#### 1. Presentation Layer (Frontend)

**Technology:** Next.js 16, React, TypeScript, Tailwind CSS

**Responsibilities:**
- User interface for campaign creation and contribution
- Wallet connection and transaction signing
- Real-time campaign statistics display
- Error handling and user feedback

**Key Components:**
- `Navbar` — Wallet connection UI
- `CampaignCard` — Campaign summary display
- `PledgeModal` — Contribution submission
- `ProgressBar` — Funding progress visualization
- `CountdownTimer` — Deadline countdown

#### 2. Integration Layer (Contract Client)

**Technology:** TypeScript, Stellar SDK, Soroban SDK

**Responsibilities:**
- Contract invocation and transaction building
- Type-safe contract interactions
- Error mapping and handling
- Caching and optimization

**Key Classes:**
- `ContractClient` — Main contract interface
- `WalletContext` — Wallet state management
- Custom hooks for data fetching

#### 3. Smart Contract Layer (Blockchain)

**Technology:** Rust, Soroban SDK

**Responsibilities:**
- Campaign state management
- Contribution tracking
- Fund distribution logic
- Access control and validation

**Key Contracts:**
- `CrowdfundContract` — Per-campaign logic
- `RegistryContract` — Campaign discovery

#### 4. Data Layer (Stellar Ledger)

**Technology:** Stellar Ledger, Soroban Storage

**Responsibilities:**
- Persistent campaign state
- Contributor records
- Transaction history

---

## Component Diagrams

### Frontend Component Hierarchy

```
App
├── WalletProvider
│   ├── Navbar
│   │   ├── ConnectButton
│   │   └── AccountDisplay
│   ├── Router
│   │   ├── HomePage
│   │   │   ├── CampaignGrid
│   │   │   │   └── CampaignCard (multiple)
│   │   │   └── SearchBar
│   │   ├── CampaignPage
│   │   │   ├── CampaignHeader
│   │   │   │   ├── ProgressBar
│   │   │   │   ├── CountdownTimer
│   │   │   │   └── CampaignStats
│   │   │   ├── CampaignDescription
│   │   │   ├── ContributorList
│   │   │   └── PledgeModal
│   │   └── CreatorPage
│   │       ├── CampaignForm
│   │       └── ManagementPanel
│   └── Footer
```

### Smart Contract Component Hierarchy

```
CrowdfundContract
├── Storage Module
│   ├── Instance Storage (campaign metadata)
│   └── Persistent Storage (contributor data)
├── Validation Module
│   ├── Parameter validation
│   ├── State validation
│   └── Authorization checks
├── Core Functions
│   ├── Lifecycle (initialize, contribute, withdraw, refund)
│   ├── Management (update_metadata, extend_deadline)
│   ├── Access Control (whitelist, blacklist)
│   └── Advanced (recurring, delegation, voting)
└── Event Emission
    └── Event types for all state changes

RegistryContract
├── Campaign Registry
│   ├── Campaign list
│   └── Category index
└── Discovery Functions
    ├── List all campaigns
    └── Filter by category
```

---

## Data Flow Diagrams

### Contribution Flow

```
User
  │
  ├─ 1. Connect Wallet
  │   └─> Freighter Wallet
  │       └─> WalletContext (stores address)
  │
  ├─ 2. View Campaign
  │   └─> Frontend fetches campaign info
  │       └─> ContractClient.getCampaignInfo()
  │           └─> Soroban RPC
  │               └─> CrowdfundContract.get_campaign_info()
  │
  ├─ 3. Submit Contribution
  │   └─> User enters amount
  │       └─> PledgeModal.handleSubmit()
  │           └─> ContractClient.contribute()
  │               └─> Build transaction
  │                   └─> Sign with Freighter
  │                       └─> Submit to Soroban RPC
  │                           └─> CrowdfundContract.contribute()
  │                               ├─ Validate amount
  │                               ├─ Transfer tokens
  │                               ├─ Update storage
  │                               └─ Emit event
  │
  └─ 4. Confirmation
      └─> Frontend polls for transaction
          └─> Display success/error
```

### Withdrawal Flow (Successful Campaign)

```
Creator
  │
  ├─ 1. Campaign Deadline Passes
  │   └─> Status remains Active
  │
  ├─ 2. Check Campaign Status
  │   └─> Frontend fetches stats
  │       └─> ContractClient.getStats()
  │           └─> Verify goal reached
  │
  ├─ 3. Initiate Withdrawal
  │   └─> Creator calls withdraw()
  │       └─> ContractClient.withdraw()
  │           └─> Build transaction
  │               └─> Sign with Freighter
  │                   └─> Submit to Soroban RPC
  │                       └─> CrowdfundContract.withdraw()
  │                           ├─ Verify deadline passed
  │                           ├─ Verify goal reached
  │                           ├─ Calculate platform fee
  │                           ├─ Transfer funds to creator
  │                           ├─ Update status to Successful
  │                           └─ Emit event
  │
  └─ 4. Confirmation
      └─> Frontend displays success
          └─> Creator receives funds
```

### Refund Flow (Failed Campaign)

```
Contributor
  │
  ├─ 1. Campaign Deadline Passes
  │   └─> Goal not reached
  │       └─> Status changes to Refunded
  │
  ├─ 2. Check Campaign Status
  │   └─> Frontend fetches stats
  │       └─> Verify goal not reached
  │
  ├─ 3. Claim Refund
  │   └─> Contributor calls refund_single()
  │       └─> ContractClient.refundSingle()
  │           └─> Build transaction
  │               └─> Sign with Freighter
  │                   └─> Submit to Soroban RPC
  │                       └─> CrowdfundContract.refund_single()
  │                           ├─ Verify goal not reached
  │                           ├─ Retrieve contribution amount
  │                           ├─ Transfer tokens back
  │                           ├─ Clear contributor record
  │                           └─ Emit event
  │
  └─ 4. Confirmation
      └─> Frontend displays success
          └─> Contributor receives refund
```

---

## Sequence Diagrams

### Campaign Initialization Sequence

```
Creator          Frontend         Wallet          Contract         Ledger
  │                 │               │                │                │
  ├─ Click Create ──>│               │                │                │
  │                 │               │                │                │
  │                 ├─ Fill Form ──>│                │                │
  │                 │               │                │                │
  │                 ├─ Submit ──────>│                │                │
  │                 │               │                │                │
  │                 │               ├─ Sign Tx ─────>│                │
  │                 │               │                │                │
  │                 │               │<─ Signed Tx ───│                │
  │                 │               │                │                │
  │                 │               ├─ Submit ──────────────────────>│
  │                 │               │                │                │
  │                 │               │                ├─ Validate ────>│
  │                 │               │                │                │
  │                 │               │                ├─ Store ───────>│
  │                 │               │                │                │
  │                 │               │                ├─ Emit Event ──>│
  │                 │               │                │                │
  │                 │<─ Success ─────────────────────────────────────│
  │                 │               │                │                │
  │<─ Confirmation ─│               │                │                │
  │                 │               │                │                │
```

### Contribution Sequence

```
Contributor      Frontend         Wallet          Contract         Token
  │                 │               │                │                │
  ├─ Enter Amount ──>│               │                │                │
  │                 │               │                │                │
  │                 ├─ Validate ────>│                │                │
  │                 │               │                │                │
  │                 ├─ Build Tx ────>│                │                │
  │                 │               │                │                │
  │                 │               ├─ Sign ────────>│                │
  │                 │               │                │                │
  │                 │               │<─ Signed ──────│                │
  │                 │               │                │                │
  │                 │               ├─ Submit ──────────────────────>│
  │                 │               │                │                │
  │                 │               │                ├─ Validate ────>│
  │                 │               │                │                │
  │                 │               │                ├─ Transfer ────>│
  │                 │               │                │                │
  │                 │               │                │<─ Confirm ─────│
  │                 │               │                │                │
  │                 │               │                ├─ Update State ─│
  │                 │               │                │                │
  │                 │               │                ├─ Emit Event ──>│
  │                 │               │                │                │
  │                 │<─ Success ─────────────────────────────────────│
  │                 │               │                │                │
  │<─ Confirmation ─│               │                │                │
  │                 │               │                │                │
```

---

## Design Decisions

### 1. Pull-Based Refund Model

**Decision:** Contributors claim refunds individually rather than contract pushing refunds.

**Rationale:**
- **Scalability** — No single transaction that fails at scale
- **Gas efficiency** — Each contributor pays for their own refund
- **Reliability** — No dependency on contract having sufficient gas
- **User control** — Contributors decide when to claim

**Trade-offs:**
- Requires contributor action (not automatic)
- Slightly more complex UX

### 2. Per-Campaign Contract Instances

**Decision:** Each campaign is a separate contract instance.

**Rationale:**
- **Isolation** — Campaign failure doesn't affect others
- **Simplicity** — Each contract has single responsibility
- **Upgradability** — Can deploy new versions for new campaigns
- **Auditability** — Clear contract boundaries

**Trade-offs:**
- Higher deployment costs
- More contracts to manage

### 3. Registry Contract for Discovery

**Decision:** Separate registry contract for campaign discovery.

**Rationale:**
- **Decoupling** — Discovery independent of campaign logic
- **Flexibility** — Can update discovery without touching campaigns
- **Efficiency** — Optimized for listing operations
- **Extensibility** — Easy to add filtering/sorting

**Trade-offs:**
- Additional contract to deploy
- Requires registration step

### 4. Basis Points for Percentages

**Decision:** Use basis points (0-10000) instead of decimals.

**Rationale:**
- **Precision** — Avoids floating-point errors
- **Consistency** — Standard in finance
- **Efficiency** — Integer arithmetic only
- **Clarity** — 250 bps = 2.5% is unambiguous

**Trade-offs:**
- Requires conversion for display
- Less intuitive for non-finance users

### 5. Vesting with Cliff

**Decision:** Support optional cliff + linear vesting on withdrawal.

**Rationale:**
- **Flexibility** — Supports various funding models
- **Security** — Prevents immediate fund access
- **Incentives** — Encourages long-term commitment
- **Compliance** — Meets regulatory requirements

**Trade-offs:**
- Adds complexity
- Requires time-based logic

### 6. Rate Limiting

**Decision:** Optional per-address contribution rate limiting.

**Rationale:**
- **Security** — Prevents spam/manipulation
- **Fairness** — Prevents whale dominance
- **Flexibility** — Creator can configure or disable
- **Efficiency** — Minimal storage overhead

**Trade-offs:**
- Adds complexity
- Requires window tracking

### 7. Whitelist/Blacklist

**Decision:** Support both whitelist and blacklist modes.

**Rationale:**
- **Flexibility** — Different use cases
- **Privacy** — Whitelist for private campaigns
- **Moderation** — Blacklist for bad actors
- **Control** — Creator has full control

**Trade-offs:**
- Adds complexity
- Requires careful management

### 8. Event Emission

**Decision:** Emit events for all state changes.

**Rationale:**
- **Auditability** — Complete transaction history
- **Indexing** — Enables efficient querying
- **Notifications** — Frontend can react to changes
- **Analytics** — Track campaign metrics

**Trade-offs:**
- Increases storage costs
- Requires event parsing

---

## Security Architecture

### Authorization Model

```
┌─────────────────────────────────────────┐
│         Authorization Checks            │
├─────────────────────────────────────────┤
│ Function              │ Required Auth   │
├───────────────────────┼─────────────────┤
│ initialize            │ Creator         │
│ contribute            │ Contributor     │
│ withdraw              │ Creator         │
│ refund_single         │ Contributor     │
│ update_metadata       │ Creator         │
│ extend_deadline       │ Creator         │
│ cancel_campaign       │ Creator         │
│ add_to_whitelist      │ Creator         │
│ add_to_blacklist      │ Creator         │
│ delegate_contribution │ Delegator       │
│ contribute_on_behalf  │ Delegate        │
└─────────────────────────────────────────┘
```

### Input Validation

```
Contribution Validation:
├─ Amount > 0
├─ Amount >= min_contribution
├─ Amount <= max_contribution (if set)
├─ Amount <= rate_limit (if set)
├─ Contributor not blacklisted
├─ Contributor on whitelist (if required)
├─ Campaign status == Active
├─ Campaign not paused
├─ Deadline not passed
└─ Token in accepted list

Withdrawal Validation:
├─ Caller == creator
├─ Campaign status == Active
├─ Deadline has passed
├─ Total raised >= goal
├─ Vesting cliff reached (if set)
└─ No emergency lock active

Refund Validation:
├─ Caller == contributor
├─ Campaign status in [Refunded, Cancelled]
├─ Contributor has contribution > 0
└─ Deadline has passed
```

### Overflow Protection

```rust
// All arithmetic uses checked operations
let total = total_raised
    .checked_add(amount)
    .ok_or(ContractError::Overflow)?;

let fee = total_raised
    .checked_mul(fee_bps as i128)
    .ok_or(ContractError::Overflow)?
    .checked_div(10_000)
    .ok_or(ContractError::Overflow)?;
```

### Reentrancy Protection

```
Token Transfer Flow:
├─ Update internal state first
├─ Then call external token contract
└─ No callback to untrusted code

Refund Flow:
├─ Mark as refunded in storage
├─ Then transfer tokens
└─ Prevents double-refund
```

### Storage Safety

```
TTL Management:
├─ Persistent storage: 100 ledgers (~8 minutes)
├─ Automatic extension on access
├─ Prevents accidental data loss
└─ Reduces storage costs

Access Patterns:
├─ Instance storage for campaign metadata
├─ Persistent storage for contributor data
└─ Optimized for common queries
```

---

## Performance Considerations

### Gas Optimization

```
Contribution:
├─ Single storage write (total raised)
├─ Single storage write (contributor amount)
├─ Single token transfer
└─ Estimated: ~50,000 gas

Withdrawal:
├─ Single storage read (total raised)
├─ Single storage read (goal)
├─ Single token transfer
└─ Estimated: ~30,000 gas

Refund:
├─ Single storage read (contribution)
├─ Single storage write (clear contribution)
├─ Single token transfer
└─ Estimated: ~30,000 gas
```

### Caching Strategy

```
Frontend Caching:
├─ Campaign stats: 30 seconds
├─ Campaign info: 5 minutes
├─ Contributor list: 1 minute
├─ User contribution: 30 seconds
└─ Invalidate on user action
```

### Pagination

```
Contributor List:
├─ Default page size: 20
├─ Max page size: 100
├─ Offset-based pagination
└─ Efficient for large lists
```

---

## Monitoring and Observability

### Key Metrics

```
Campaign Metrics:
├─ Total raised
├─ Contribution count
├─ Average contribution
├─ Largest contribution
├─ Progress percentage
└─ Time to goal

System Metrics:
├─ Transaction success rate
├─ Average gas usage
├─ RPC response time
├─ Error rates by type
└─ User engagement
```

### Event Tracking

```
Events Emitted:
├─ campaign:initialized
├─ campaign:contributed
├─ campaign:withdrawn
├─ campaign:refunded
├─ campaign:cancelled
├─ campaign:metadata_updated
├─ campaign:deadline_extended
└─ campaign:status_changed
```

---

## Future Enhancements

### Planned Features

1. **Milestone-Based Funding**
   - Release funds at milestones
   - Contributor voting on milestones

2. **Secondary Market**
   - Trade campaign tokens
   - Price discovery

3. **Insurance**
   - Contributor insurance pool
   - Automatic payout on failure

4. **Governance**
   - DAO governance
   - Community voting on parameters

5. **Multi-Token Support**
   - Accept multiple tokens
   - Automatic conversion

### Scalability Improvements

1. **Batch Operations**
   - Batch refunds
   - Batch contributions

2. **Caching Layer**
   - Redis for campaign stats
   - Reduce RPC calls

3. **Indexing**
   - Stellar Indexer for events
   - Fast campaign discovery

4. **Sharding**
   - Multiple registry contracts
   - Distribute load

---

## References

- [Stellar Documentation](https://developers.stellar.org)
- [Soroban Documentation](https://soroban.stellar.org)
- [Smart Contract API Reference](./contract-api.md)
- [Frontend API Reference](./frontend-api.md)
