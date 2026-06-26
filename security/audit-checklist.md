# Smart Contract Security Audit Checklist

This document provides a comprehensive checklist for auditing the Fund-My-Cause Soroban smart contracts before mainnet deployment.

## 1. Access Control & Authorization

### Creator Permissions
- [ ] Only campaign creator can call `withdraw()`
- [ ] Only campaign creator can call `update_metadata()`
- [ ] Creator cannot call `refund_single()` for themselves
- [ ] Admin is enforced as a separate role from creator

### Admin Permissions
- [ ] Only admin can activate/deactivate emergency pause
- [ ] Only admin can modify platform configuration
- [ ] Admin cannot directly withdraw funds
- [ ] Admin roles are immutable or follow strict governance

### Whitelist/Blacklist
- [ ] Whitelisted addresses can always contribute (if whitelist enabled)
- [ ] Blacklisted addresses cannot contribute
- [ ] Whitelist and blacklist are mutually exclusive for a given address
- [ ] Whitelist/blacklist can be updated only by authorized addresses

## 2. Reentrancy Protection

### Contract-Level Guards
- [ ] All state-modifying functions have reentrancy guards
- [ ] `withdraw()` uses checks-effects-interactions pattern
- [ ] `refund_single()` cannot be called recursively
- [ ] External token transfers happen **after** state updates

### Pull-Based Model
- [ ] Refunds use pull-based (withdraw) pattern, not push (send)
- [ ] No funds are auto-transferred to unknown addresses
- [ ] Each address manages their own refund claim

## 3. Input Validation & Sanitization

### Numeric Inputs
- [ ] Goal amount > 0
- [ ] Deadline > current time (future deadline)
- [ ] Min contribution >= 0
- [ ] Max contribution == 0 OR >= min contribution
- [ ] Platform fee <= 10,000 basis points (100%)
- [ ] Contribution amounts fit in i128 without overflow
- [ ] Arithmetic operations check for overflow/underflow

### String Inputs
- [ ] Title and description lengths are bounded (max 500 chars)
- [ ] No null bytes in strings
- [ ] Social links are validated as valid URLs

### Address Inputs
- [ ] Creator address is not zero address
- [ ] Token address is not zero address
- [ ] No duplicate addresses in whitelist/blacklist
- [ ] Platform fee address differs from creator

## 4. Overflow & Underflow Protection

### Arithmetic Operations
- [ ] All i128 additions check for overflow
- [ ] All subtractions check for underflow
- [ ] Contribution + existing total doesn't exceed i128::MAX
- [ ] Platform fee calculations don't lose precision

### Boundary Checks
- [ ] Total raised never exceeds goal after success
- [ ] Total refunded matches total raised on full refund
- [ ] Vesting amounts don't exceed total available funds

## 5. State Consistency

### Campaign Lifecycle
- [ ] Status transitions are valid (Active -> Success OR Active -> Failed)
- [ ] Status cannot transition backward
- [ ] Initialized state persists and prevents re-initialization
- [ ] Campaign cannot be both Succeeded and Failed

### Contribution Tracking
- [ ] Each contributor's balance equals sum of their individual contributions
- [ ] Total raised equals sum of all contributions
- [ ] Refund amount never exceeds contributor's balance
- [ ] Withdrawn amounts are tracked and prevent double-withdrawal

### Goal Verification
- [ ] Goal success is determined once at deadline, not per-call
- [ ] Goal comparison is >= not just >
- [ ] Cached goal status prevents inconsistency

## 6. Time-Based Logic

### Deadline Enforcement
- [ ] Contributions only allowed before deadline
- [ ] Withdrawals only allowed after deadline
- [ ] Refunds only allowed after deadline if goal not met
- [ ] Deadline cannot be modified after initialization

### Ledger Time
- [ ] Uses `env.ledger().timestamp()` consistently
- [ ] No reliance on block numbers
- [ ] Time comparisons handle edge cases (exactly at deadline)

## 7. External Dependencies

### Token Contract Calls
- [ ] All token transfers use safe_transfer or similar patterns
- [ ] Token contract address is verified
- [ ] Transfer failures are propagated as errors
- [ ] No assumption about token decimals

### Registry Contract Interaction
- [ ] Registry calls are idempotent or checked for duplicates
- [ ] Registry contract address is immutable
- [ ] Registry failures don't block campaign operations

## 8. Error Handling

### Error Propagation
- [ ] All errors have distinct error codes
- [ ] Error messages are informative but not verbose
- [ ] Errors don't leak sensitive information
- [ ] No generic "Error" returns

### Edge Cases
- [ ] Empty contribution list is handled
- [ ] Zero deadline is rejected
- [ ] Negative amounts are rejected
- [ ] Contributions after goal reached are rejected

## 9. Event Logging

### Required Events
- [ ] `Initialized` - on campaign creation
- [ ] `Contributed` - on each contribution with amount
- [ ] `Withdrawn` - on creator withdrawal with amount
- [ ] `Refunded` - on each refund with amount
- [ ] `Cancelled` - on campaign cancellation
- [ ] `StatusUpdated` - on any status change

### Event Data
- [ ] Events include campaign ID
- [ ] Events include contributor/actor address
- [ ] Events include amounts and timestamps
- [ ] Events are emitted **after** state changes

## 10. Emergency Stop Mechanism

### Circuit Breaker
- [ ] Emergency pause flag exists and is checked
- [ ] Pause prevents new contributions
- [ ] Pause prevents withdrawals
- [ ] Pause still allows refunds (pull-based)
- [ ] Only admin can trigger pause
- [ ] Pause can be reset by admin

### Graceful Degradation
- [ ] Contract remains usable after pause
- [ ] State is not lost during pause
- [ ] Pause is temporary and reversible

## 11. Rate Limiting

### Contribution Rate Limits
- [ ] Per-address rate limit is enforced
- [ ] Rate limits are configurable
- [ ] Rate limits prevent spam attacks
- [ ] Rate limit resets per block/ledger

### Operation Rate Limits
- [ ] Refunds can't be called excessively by single address
- [ ] Metadata updates are rate limited
- [ ] Rate limit errors are user-friendly

## 12. Storage & Gas Efficiency

### Storage Access
- [ ] Unnecessary storage reads are minimized
- [ ] Batch operations combine multiple updates
- [ ] Storage keys use efficient prefix schemes

### Persistent vs Instance Storage
- [ ] Per-contributor data uses persistent storage
- [ ] Campaign metadata uses instance storage
- [ ] Storage choice is justified for each key

## 13. Initialization & Migration

### Initialization
- [ ] Initialization only happens once
- [ ] All required state is set during initialization
- [ ] Initialization events are emitted
- [ ] Cannot initialize with invalid parameters

### Version Management
- [ ] Contract version is stored and queryable
- [ ] Version migrations are tested
- [ ] Backward compatibility is documented

## 14. Documentation & Testing

### Documentation
- [ ] All public functions are documented
- [ ] Security assumptions are documented
- [ ] Threat model is up-to-date
- [ ] Attack vectors are listed and mitigated

### Testing
- [ ] Unit tests cover all public functions
- [ ] Integration tests cover multi-step flows
- [ ] Fuzz tests for edge cases
- [ ] Test coverage >= 80%

## 15. Platform Fee Mechanism

### Fee Calculation
- [ ] Fee is calculated as percentage of withdrawal amount
- [ ] Fee amount fits in i128
- [ ] Creator receives: withdrawal - fee
- [ ] Platform receives: fee

### Fee Transfer
- [ ] Fee is transferred to designated platform address
- [ ] Fee transfer happens atomically with withdrawal
- [ ] Failed fee transfer fails the whole withdrawal
- [ ] Platform fee address is validated

## 16. Denial-of-Service Prevention

### Computational Limits
- [ ] Loops have bounded iteration counts
- [ ] No O(n^2) or worse algorithms
- [ ] Gas costs are predictable and tested

### Caller Protection
- [ ] No way for one caller to block others
- [ ] Refunds don't require cooperation of other parties
- [ ] No unbounded storage growth per user

## 17. Formal Verification (Optional/Future)

### Properties to Verify
- [ ] If goal is reached and creator withdraws, total_withdrawn == goal (approx)
- [ ] If goal not reached, all contributions can be refunded
- [ ] No funds are created or destroyed (conservation)
- [ ] Status never transitions backward

### Tools
- [ ] Specify properties in formal language (TLA+, Coq, etc.)
- [ ] Run automated provers
- [ ] Document any unproven properties

## Audit Sign-Off

- **Auditor Name**: _________________
- **Date**: _________________
- **Overall Risk Assessment**: [ ] Low [ ] Medium [ ] High
- **Recommended for Mainnet**: [ ] Yes [ ] No [ ] Conditional

### Comments
_________________

## References

- [Soroban Security Best Practices](https://soroban.stellar.org)
- [Common Smart Contract Vulnerabilities](https://github.com/runtimeverification/smartcontract-bugs)
- [OWASP Smart Contract Top 10](https://owasp.org/www-project-smart-contract-top-10/)
