# Gas Cost Monitoring

This document covers gas cost tracking, analysis, and optimization for Fund-My-Cause smart contracts.

## Overview

Gas cost monitoring ensures:
- Contract operations remain efficient
- Costs don't unexpectedly increase
- Optimization opportunities are identified
- Users have predictable transaction costs

## Gas Cost Thresholds

| Operation | Max Gas | Warning Threshold | Current |
|-----------|---------|-------------------|---------|
| `initialize` | 100,000 | 80,000 | - |
| `contribute` | 50,000 | 40,000 | - |
| `withdraw` | 50,000 | 40,000 | - |
| `refund_single` | 50,000 | 40,000 | - |
| `registry.register` | 50,000 | 40,000 | - |
| `registry.list` | 30,000 | 25,000 | - |

## Automated Monitoring

### CI/CD Integration

The `gas-monitoring.yml` workflow runs on every push and PR:

```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
```

### Gas Reports

Reports are generated in `target/gas-reports/`:

```
target/gas-reports/
├── gas-report-20260427-144626.json
├── thresholds.json
└── optimization-recommendations.md
```

### Comparison with Base Branch

On pull requests, gas costs are compared with the base branch:

```bash
./scripts/monitor-gas.sh --compare-base
```

Alerts are triggered if gas usage increases by more than 10%.

## Manual Gas Monitoring

### Generate Gas Report

```bash
./scripts/monitor-gas.sh
```

### Compare with Base Branch

```bash
./scripts/monitor-gas.sh --compare-base
```

### Set Custom Threshold

```bash
./scripts/monitor-gas.sh --threshold 15
```

## Gas Report Format

```json
{
  "timestamp": "2026-04-27T14:46:26Z",
  "contracts": {
    "crowdfund": {
      "initialize": {
        "gas_used": 45000,
        "gas_limit": 100000,
        "efficiency": 45
      },
      "contribute": {
        "gas_used": 25000,
        "gas_limit": 50000,
        "efficiency": 50
      }
    }
  },
  "summary": {
    "total_gas_used": 70000,
    "average_efficiency": 47.5,
    "peak_operation": "initialize"
  }
}
```

## Optimization Recommendations

### Current Optimizations

The build is already optimized with:

```toml
[profile.release]
opt-level = "z"      # Optimize for size
lto = true           # Link-time optimization
strip = "symbols"    # Remove debug symbols
codegen-units = 1    # Single codegen unit
```

### Recommended Improvements

1. **Storage Access**
   - Cache frequently accessed values
   - Batch storage operations
   - Use efficient serialization

2. **Computation**
   - Precompute values where possible
   - Use lookup tables
   - Minimize loop iterations

3. **Contract Design**
   - Consider contract composition
   - Implement lazy evaluation
   - Split large contracts

## Monitoring Strategy

### Daily Monitoring

1. Check gas reports in CI/CD
2. Review PR comments with gas analysis
3. Alert on threshold violations

### Weekly Review

1. Analyze gas trends
2. Identify optimization opportunities
3. Plan improvements

### Quarterly Audit

1. Benchmark against similar contracts
2. Review optimization effectiveness
3. Update thresholds if needed

## Alerts and Notifications

### Threshold Violations

Alerts are triggered when:
- Gas usage exceeds max threshold
- Gas increases by more than 10% vs base branch
- New operations exceed warning threshold

### PR Comments

Gas analysis is automatically commented on PRs:

```
## ⛽ Gas Cost Analysis

### Crowdfund Contract
- initialize: 45,000 gas (45% of limit)
- contribute: 25,000 gas (50% of limit)
- withdraw: 28,000 gas (56% of limit)

### Registry Contract
- register: 22,000 gas (44% of limit)
- list: 15,000 gas (50% of limit)

✓ All operations within thresholds
```

## Profiling and Analysis

### Identify Hot Paths

Use Soroban's built-in profiling:

```bash
# Build with profiling
cargo build --release --target wasm32-unknown-unknown

# Analyze WASM
wasm-objdump -x target/wasm32-unknown-unknown/release/crowdfund.wasm
```

### Compare Versions

```bash
# Generate report for current version
./scripts/monitor-gas.sh > current.json

# Checkout previous version
git checkout HEAD~1

# Generate report for previous version
./scripts/monitor-gas.sh > previous.json

# Compare
diff current.json previous.json
```

## Best Practices

1. **Monitor continuously** — Track gas costs in every build
2. **Set realistic thresholds** — Based on contract complexity
3. **Alert early** — Catch increases before they become problems
4. **Optimize regularly** — Review and improve quarterly
5. **Document changes** — Log all optimizations with impact
6. **Test thoroughly** — Verify optimizations don't break functionality
7. **Benchmark** — Compare with similar contracts in the ecosystem

## Troubleshooting

### High Gas Usage

1. Check for unnecessary storage operations
2. Review loop iterations and conditions
3. Look for redundant computations
4. Consider contract composition

### Unexpected Increases

1. Compare with previous version
2. Identify changed code paths
3. Profile the new code
4. Revert or optimize changes

### Threshold Violations

1. Review the operation causing violation
2. Determine if threshold is realistic
3. Optimize the operation or update threshold
4. Document the decision

## References

- [Soroban Gas Model](https://soroban.stellar.org/docs/learn/fees-and-metering)
- [Soroban Performance](https://soroban.stellar.org/docs/learn/storing-data)
- [Rust Optimization](https://doc.rust-lang.org/cargo/profiles/release.html)
- [WASM Optimization](https://rustwasm.org/docs/book/reference/code-size.html)
