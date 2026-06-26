# Comprehensive Fuzz Testing Suite

## Overview

The Fund-My-Cause smart contract includes a comprehensive fuzz testing suite designed to discover edge cases, verify invariants, and identify security vulnerabilities in a financial application handling real funds.

## Test Categories

### 1. Property-Based Testing (`tests/fuzz_tests.rs`)

Using `proptest`, the suite generates arbitrary inputs to verify contract behavior under diverse conditions.

#### Contribute Properties
- **`fuzz_contribute_increases_total`** — Each contribution increases total_raised
- **`fuzz_contribute_records_contribution`** — Contributions are accurately recorded per address
- **`fuzz_contribute_multiple_accumulates`** — Multiple contributions from same address accumulate correctly
- **`fuzz_contribute_after_deadline_fails`** — Contributions after deadline are rejected
- **`fuzz_contribute_before_deadline_succeeds`** — Contributions before deadline succeed

**Coverage:** Input range 1i128 to 10,000,000i128 across 300 test cases

#### Refund Properties
- **`fuzz_refund_after_failed_campaign_restores_balance`** — Failed campaigns return funds
- **`fuzz_refund_idempotent`** — Multiple refund calls don't increase balance
- **`fuzz_refund_after_success_fails`** — Refunds fail on successful campaigns

**Coverage:** Edge cases including partial goals, multiple contributors

#### Withdraw Properties
- **`fuzz_withdraw_clears_total_on_success`** — Successful withdrawal zeroes total_raised
- **`fuzz_withdraw_before_deadline_fails`** — Early withdrawal attempts fail
- **`fuzz_withdraw_below_goal_fails`** — Withdrawal below goal fails
- **`fuzz_withdraw_with_platform_fee_distributes_correctly`** — Platform fees calculated accurately

**Coverage:** Goal ranges 1,000–100,000i128, fee ranges 0–5,000 bps

#### Cross-Function Properties
- **`fuzz_many_contributors_total_consistency`** — Total matches sum of contributions across 5+ contributors
- **`fuzz_contribute_refund_balance_preservation`** — Full balance restored after contribute → refund cycle
- **`fuzz_multiple_refunds_parallel_withdrawal`** — Concurrent refunds maintain balance invariants

**Coverage:** Multiple contributor scenarios with varying amounts

#### Numerical Safety
- **`fuzz_extreme_amounts_handled_safely`** — Large amounts (i128::MAX / 2, i128::MAX / 4) don't panic
- **`fuzz_total_overflow_protected`** — Overflow cases handled (error or saturate)
- **`fuzz_deadline_edge_cases`** — Boundary conditions at deadline
- **`fuzz_zero_amount_rejected`** — Zero contributions rejected

**Configuration:**
- **Cases:** 200–300 per property (configurable via `ProptestConfig::with_cases`)
- **Regressions:** Automatically saved to `fuzz_tests.proptest-regressions`
- **Failure Mode:** Failing inputs are minimized and persisted for reproducibility

### 2. Invariant Testing (`tests/invariants.rs`)

Verifies properties that **must always hold true** throughout the contract lifecycle.

#### Core Invariants

1. **`test_invariant_total_raised_matches_sum_of_contributions`**
   - `total_raised() == sum(contribution(addr) for all addr)`
   - Detects accounting mismatches

2. **`test_invariant_total_raised_never_negative`** (proptest-based)
   - `total_raised() >= 0` always
   - Tests with 1–20 arbitrary contributions

3. **`test_invariant_individual_contribution_never_negative`** (proptest-based)
   - `contribution(addr) >= 0` for all contributors
   - Prevents underflow vulnerabilities

4. **`test_invariant_contribution_zero_after_refund`**
   - After `refund_single(addr)`, `contribution(addr) == 0`
   - Prevents double-refunds

5. **`test_invariant_no_double_refund`**
   - Multiple `refund_single` calls don't increase balance
   - Verifies idempotency

6. **`test_invariant_contract_balance_zero_after_successful_withdraw`**
   - After `withdraw()` on successful campaign, `contract_balance == 0`
   - Ensures all funds distributed

7. **`test_invariant_total_equals_sum_after_random_ops`** (proptest, 100 cases)
   - Maintains accounting invariant across random contributor sequences

8. **`test_invariant_no_funds_lost_before_deadline`** (proptest, 100 cases)
   - `contract_balance >= total_raised` (accounts for fees)

## 3. Adversarial Testing (`tests/adversarial.rs`)

Simulates malicious or edge-case scenarios common in financial systems.

### Reentrancy & Double-Spending
- **`test_adversarial_multiple_refunds_same_tx`** — Prevents reentrancy/double-refund attacks
- **`test_adversarial_race_withdraw_vs_refund`** — Withdrawal blocks refunds on success
- **`test_adversarial_selective_refund_targeting`** — All contributors get refunds despite order

### Front-Running & Timing
- **`test_adversarial_front_running_deadline`** — Contributions at exact deadline rejected
- **`test_adversarial_contribute_after_goal_reached`** — Over-funding is allowed (no early close)

### Fee Manipulation
- **`test_adversarial_platform_fee_manipulation`** — Extreme fee (100%) handled safely
- **`test_adversarial_reject_wrong_token`** — Wrong token address rejected

### State Consistency
- **`test_adversarial_state_consistency_under_stress`** — 10 rapid contributions maintain invariants
- **`test_adversarial_past_deadline_initialization`** — Past-deadline campaigns rejected

## Running the Tests

### All tests
```bash
cd contracts/crowdfund
cargo test
```

### Fuzz tests only
```bash
cargo test --test fuzz_tests -- --nocapture
```

### Invariants only
```bash
cargo test --test invariants -- --nocapture
```

### Adversarial tests only
```bash
cargo test --test adversarial -- --nocapture
```

### Single test
```bash
cargo test test_invariant_no_double_refund -- --nocapture
```

### With extended proptest cases (slower, more thorough)
```bash
PROPTEST_CASES=10000 cargo test --test fuzz_tests
```

## Proptest Regression Handling

When a fuzz test fails, `proptest` automatically:
1. **Minimizes** the failing input to the simplest reproducer
2. **Saves** it to `.proptest-regressions`
3. **Re-runs** that case on subsequent test runs

Example regression file:
```
# ./tests/fuzz_tests.proptest-regressions
cc fuzz_contribute_increases_total::[$VAR_1]
2 46 0 0 0 0 0 0 0 0 ...
```

To clear regressions (useful after fixes):
```bash
rm tests/fuzz_tests.proptest-regressions
```

## CI Integration

The GitHub Actions workflow (`contract.yml`) runs all test suites on every push/PR:

```yaml
- name: Run fuzz tests (property-based)
  run: cargo test --test fuzz_tests -- --nocapture

- name: Run invariant tests
  run: cargo test --test invariants -- --nocapture

- name: Run adversarial tests
  run: cargo test --test adversarial -- --nocapture
```

## Test Coverage

| Category | Count | Cases | Focus |
|----------|-------|-------|-------|
| Property-Based | 12 | 200–300 | Input ranges, state transitions |
| Invariant | 8 | 100–200 | Accounting, consistency |
| Adversarial | 10 | 1 | Security scenarios |
| **Total** | **30+** | **2,000+** | Comprehensive coverage |

## Performance Metrics

- **Typical run time:** ~5–10 seconds (local)
- **CI run time:** ~30–60 seconds (with compilation)
- **Regression tests:** < 1 second (no new generation)

## Key Security Properties Verified

✅ No double-refunds or reentrancy  
✅ Contributions and refunds balance correctly  
✅ Platform fees computed safely without overflow  
✅ Deadline enforcement prevents late contributions  
✅ Failed campaigns refund all contributors  
✅ Successful campaigns clear contract balance  
✅ No funds are lost or created  
✅ State is consistent under concurrent operations  

## Future Enhancements

1. **Fuzzing corpus** — Save interesting/boundary test inputs for regression
2. **Performance benchmarking** — Track gas usage across fuzz cases
3. **Differential testing** — Compare against reference implementation
4. **Symbolic execution** — Use SMT solvers for formal verification
5. **Mutation testing** — Verify tests catch common code mutations

## References

- [PropTest documentation](https://docs.rs/proptest/latest/)
- [Property-Based Testing](https://hypothesis.works/articles/what-is-property-based-testing/)
- [Invariant testing in finance](https://www.fuzzingbook.org/)

