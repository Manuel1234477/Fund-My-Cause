# Contract Events Reference

Every state-changing function publishes one or more `soroban_sdk` events. Topics follow the format `("campaign", "<event_name>")` unless noted.

## Subscribing to events (TypeScript)

```ts
import { rpc as SorobanRpc, nativeToScVal } from "@stellar/stellar-sdk";

const server = new SorobanRpc.Server(process.env.NEXT_PUBLIC_SOROBAN_RPC_URL!);

const events = await server.getEvents({
  startLedger: latestLedger,
  filters: [{
    type: "contract",
    contractIds: [CONTRACT_ID],
    topics: [
      // Listen for all "campaign" events
      [nativeToScVal("campaign", { type: "symbol" }).toXDR("base64"), "*"],
    ],
  }],
});
```

---

## Crowdfund Contract Events

### Core lifecycle

| Event name | Emitted by | Payload fields |
|-----------|-----------|----------------|
| `initialized` | `initialize` | `creator`, `token`, `goal`, `deadline` |
| `contributed` | `contribute` | `contributor`, `amount`, `new_total`, `matched_amount` |
| `contribution_recorded` | `contribute` | `contributor`, `amount`, `timestamp`, `running_total` |
| `withdrawn` | `withdraw` | `creator`, `total`, `fee`, `payout` |
| `refunded` | `refund_single` | `contributor`, `amount` |
| `partial_refund` | `refund_partial` | `contributor`, `amount`, `reason` |
| `batch_refund_completed` | `refund_batch` | `count` (number refunded) |
| `status_changed` | various | `old_status`, `new_status` |
| `cancelled` | `cancel_campaign` | `creator`, `total_raised` |

### Metadata & management

| Event name | Emitted by | Payload fields |
|-----------|-----------|----------------|
| `metadata_updated` | `update_metadata` | `title`, `description` |
| `metadata_versioned` | `update_metadata` | `version`, `timestamp` |
| `deadline_extended` | `extend_deadline` | `new_deadline` |
| `goal_adjusted` | `adjust_goal` | `old_goal`, `new_goal` |
| `category_updated` | `update_category` | `category` |
| `visibility_changed` | `set_visibility` | `visibility` |
| `paused` | `pause` | `creator` |
| `resumed` | `resume` / `unpause` | `creator` |
| `archived` | `archive` | `creator`, `archived_at` |

### Access control

| Event name | Emitted by | Payload fields |
|-----------|-----------|----------------|
| `whitelisted` | `add_to_whitelist` | `address` |
| `whitelist_removed` | `remove_from_whitelist` | `address` |
| `blacklisted` | `add_to_blacklist` | `address` |
| `blacklist_removed` | `remove_from_blacklist` | `address` |
| `whitelist_only_set` | `set_whitelist_only` | `enabled` |
| `rate_limit_updated` | `set_rate_limit` | `max_amount`, `window_seconds` |
| `rate_limit_hit` | `contribute` | `contributor`, `attempted`, `period_amount`, `max_amount` |

### Recurring contributions

| Event name | Emitted by | Payload fields |
|-----------|-----------|----------------|
| `recurring_setup` | `setup_recurring` | `contributor`, `amount`, `interval`, `end_date` |
| `recurring_executed` | `execute_recurring` | `contributor`, `amount`, `next_execution` |
| `recurring_cancelled` | `cancel_recurring` | `contributor` |

### Delegation

| Event name | Emitted by | Payload fields |
|-----------|-----------|----------------|
| `delegation_created` | `delegate_contribution` | `delegator`, `delegate`, `amount` |
| `delegated_contribution` | `contribute_on_behalf` | `delegate`, `delegator`, `amount` |
| `delegation_revoked` | `revoke_delegation` | `delegator` |

### Extension voting

| Event name | Emitted by | Payload fields |
|-----------|-----------|----------------|
| `extension_proposed` | `propose_extension` | `new_deadline`, `end_time` |
| `extension_voted` | `vote_on_extension` | `contributor`, `approve`, `weight` |
| `extension_executed` | `execute_extension` | `new_deadline` |

### Emergency withdrawal

| Event name | Emitted by | Payload fields |
|-----------|-----------|----------------|
| `emergency_initiated` | `initiate_emergency_withdrawal` | `lock_until` |
| `multisig_configured` | `setup_emergency_multisig` | `required_approvals` |
| `emergency_approved` | `approve_emergency_withdrawal` | `approver`, `approval_count` |
| `emergency_executed` | `execute_emergency_withdrawal` | `creator`, `amount` |

### Matching

| Event name | Emitted by | Payload fields |
|-----------|-----------|----------------|
| `matching_setup` | `setup_matching` | `sponsor`, `match_ratio`, `max_match` |
| `matching_sponsor_refunded` | `withdraw` / `refund_matching_sponsor` | `sponsor`, `amount` |

### Rewards & tiers

| Event name | Emitted by | Payload fields |
|-----------|-----------|----------------|
| `tiers_set` | `set_reward_tiers` | `count` |
| `tier_assigned` | `contribute` | `contributor`, `tier_name`, `min_amount` |
| `rewards_configured` | `configure_rewards` | `reward_token`, `reward_per_unit` |
| `rewards_distributed` | `distribute_rewards` | `contributor`, `amount` |

### Insurance (topic: `"insurance"`)

| Event name | Emitted by | Payload fields |
|-----------|-----------|----------------|
| `enabled` | `enable_insurance` | `fee_bps`, `provider` |
| `payout` | refund flow | `contributor`, `amount` |

### Templates & cloning

| Event name | Emitted by | Payload fields |
|-----------|-----------|----------------|
| `template_applied` | `initialize_from_template` | `template_type` |
| `cloned` | `clone_campaign` | `new_creator`, `new_goal`, `new_deadline` |

---

## Registry Contract Events

Topic format: `("registry", "<event_name>")`

| Event name | Emitted by | Data |
|-----------|-----------|------|
| `registered` | `register` | `campaign_id: Address` |
