# Contract Error Reference

All mutable contract functions return `Result<_, ContractError>`. This table lists every error code, what triggers it, and how to handle it client-side.

| Code | Name | Trigger | Client action |
|------|------|---------|---------------|
| 1 | `AlreadyInitialized` | `initialize` called on a contract that already has state | Do not call `initialize` twice; deploy a fresh contract |
| 2 | `CampaignEnded` | Contribution after deadline | Disable contribute UI when `now >= deadline` |
| 3 | `CampaignStillActive` | `withdraw` / `refund_single` called before deadline | Wait until `now >= deadline` |
| 4 | `GoalNotReached` | `withdraw` called when `total_raised < goal` | Check `get_stats().progress_bps` before calling `withdraw` |
| 5 | `GoalReached` | `refund_single` called when goal was met | Do not show refund UI when campaign succeeded |
| 6 | `Overflow` | Arithmetic overflow in contribution accumulation | Contribution would push total past `i128::MAX`; extremely unlikely |
| 7 | `NotActive` | Mutating call when status ≠ `Active` | Guard all write calls with a status check |
| 8 | `InvalidFee` | Fee basis points exceed 10 000 | Validate `fee_bps <= 10_000` before sending |
| 9 | `BelowMinimum` | Contribution below `min_contribution` | Show minimum amount in UI; validate before sending |
| 10 | `InvalidDeadline` | Deadline ≤ current ledger time | Use a deadline at least 300 s in the future |
| 11 | `CampaignPaused` | Contribution while campaign is `Paused` | Show "campaign is paused" message |
| 12 | `InvalidGoal` | Goal ≤ 0 | Validate `goal > 0` before sending `initialize` |
| 13 | `TokenNotAccepted` | Contribution token not in `accepted_tokens` | Offer only accepted tokens in the contribution UI |
| 14 | `ExceedsMaximum` | New total would exceed `max_contribution` | Show remaining headroom in UI |
| 15 | `NotWhitelisted` | Address not in whitelist when `whitelist_only = true` | Show "private campaign" message |
| 16 | `Blacklisted` | Address is in the blacklist | Show "access restricted" message |
| 17 | `InvalidDelegation` | Invalid delegation parameters (e.g. zero amount) | Validate delegation amount > 0 |
| 18 | `DelegationNotFound` | `revoke_delegation` / `contribute_on_behalf` with no active delegation | Check `get_delegation` before acting |
| 19 | `InvalidTemplate` | Unrecognised `TemplateType` value | Use only defined `TemplateType` variants |
| 20 | `VotingEnded` | Voted after extension proposal window closed | Check `get_extension_proposal().end_time` |
| 21 | `InvalidRecurringPlan` | `interval = 0`, `end_date` in the past, or `amount = 0` | Validate plan parameters before sending |
| 22 | `RefundLimitExceeded` | Partial refund > 50% of contribution | Cap partial refund at `contribution / 2` |
| 23 | `VestingNotComplete` | `withdraw` before vesting cliff | Display cliff date to creator |
| 24 | `EmergencyLocked` | Emergency withdrawal during 24 h lock period | Display lock expiry time |
| 25 | `RateLimitExceeded` | Contribution exceeds rate limit window | Show "rate limit reached; try again later" |
| 26 | `MessageTooLong` | Contribution message > 256 chars | Enforce 256-char limit in UI |
| 27 | `StringEmpty` | Required string (title / description) is empty | Validate non-empty before sending |
| 28 | `StringTooLong` | String exceeds max length (title > 64, description > 512) | Enforce limits in UI |
| 29 | `AmountNotPositive` | Amount ≤ 0 | Validate `amount > 0` |
| 30 | `SelfFeeAddress` | Platform fee address same as creator | Reject this config in UI |
| 31 | `GoalOverflow` | Goal would overflow i128 | Use a goal ≤ 170 141 183 460 469 231 731 stroops |
| 32 | `InsufficientFunds` | Insufficient tokens in pool | Ensure pool balance before calling |
| 33 | `Unauthorized` | Caller lacks required auth | Check caller matches expected address |
| 34 | `InvalidRateLimit` | `window_seconds = 0` or `max_amount = 0` | Validate before setting rate limit |
| 35 | `MultiSigNotMet` | Emergency withdrawal threshold not yet reached | Collect more approvals before executing |
| 36 | `ProposalNotFound` | No active extension proposal exists | Check `get_extension_proposal()` first |
| 37 | `AlreadyVoted` | Address has already voted on proposal | Prevent double-voting in UI |
| 38 | `NoRewardsConfigured` | `distribute_rewards` called with no `RewardConfig` | Call `configure_rewards` first |
| 39 | `NotCreator` | Caller is not the campaign creator | Guard creator-only UI behind address check |

---

## Parsing errors client-side (TypeScript)

```ts
import { ContractError } from "@/lib/contract";

const ERROR_MESSAGES: Record<number, string> = {
  2:  "This campaign has ended.",
  3:  "The campaign is still active.",
  7:  "The campaign is not active.",
  9:  "Amount is below the minimum contribution.",
  11: "This campaign is temporarily paused.",
  14: "This would exceed your contribution limit.",
  15: "This campaign is invite-only.",
  25: "You have reached the rate limit. Please try again later.",
};

function handleContractError(e: unknown): string {
  if (e instanceof ContractError) {
    return ERROR_MESSAGES[e.code] ?? `Contract error ${e.code}.`;
  }
  if (e instanceof Error) return e.message;
  return "An unexpected error occurred.";
}
```

---

## Simulation error patterns

Soroban simulation errors surface as diagnostic strings. Common patterns:

```ts
function parseSimError(raw: string): string {
  const codeMatch = raw.match(/Error\(Contract,\s*#(\d+)\)/);
  if (codeMatch) {
    const code = Number(codeMatch[1]);
    return ERROR_MESSAGES[code] ?? `Contract rejected the call (error ${code}).`;
  }
  if (/below.?minimum/i.test(raw)) return "Amount is below the minimum.";
  if (/deadline/i.test(raw))       return "This campaign has ended.";
  if (/cancelled/i.test(raw))      return "This campaign has been cancelled.";
  return raw.split("\n")[0] ?? "Simulation failed.";
}
```
