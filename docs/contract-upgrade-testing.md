# Contract Upgrade Testing Guide

Automated testing for Soroban contract upgrades to ensure data integrity and backward compatibility.

## Overview

The contract upgrade testing workflow validates:

1. **Build Compatibility**: Both old and new versions compile successfully
2. **Size Constraints**: New contract stays within 64KB WASM limit
3. **Data Integrity**: Storage is preserved during upgrade
4. **Function Compatibility**: All public functions work post-upgrade
5. **Version Management**: Version numbers increment correctly
6. **Breaking Changes**: Detects removed or changed public APIs

## Workflow Triggers

The workflow runs automatically on:

- Pull requests to `main` that modify `contracts/` directory
- Manual trigger via GitHub Actions UI

## Testing Process

### 1. Build Old Version

```bash
# Checkout base branch version
git show origin/main:contracts/crowdfund/src/lib.rs > /tmp/old_contract.rs

# Build old contract WASM
cargo build --release --target wasm32-unknown-unknown -p crowdfund
```

### 2. Build New Version

```bash
# Restore current branch version
git checkout HEAD -- contracts/crowdfund/

# Build new contract WASM
cargo build --release --target wasm32-unknown-unknown -p crowdfund
```

### 3. Size Comparison

Validates that new contract doesn't exceed Soroban's 64KB limit:

```
Old Size:  45,234 bytes
New Size:  47,892 bytes
Delta:     +2,658 bytes (+5.9%)
Limit:     65,536 bytes
Status:    ✓ Within limits
```

### 4. Migration Testing

Runs upgrade-specific tests:

```bash
cargo test --release --test '*upgrade*'
```

Tests should verify:
- State migration logic
- Data transformation correctness
- Backward compatibility

### 5. Data Integrity Tests

```bash
cargo test --release --test '*data*'
```

Validates:
- Storage keys preserved
- Data types compatible
- No data loss during upgrade

### 6. Post-Upgrade Function Tests

```bash
cargo test --release --lib
```

Ensures all contract functions work correctly after upgrade.

### 7. Version Compatibility

Verifies version numbers:

```rust
// Old version
const CONTRACT_VERSION: u32 = 3;

// New version
const CONTRACT_VERSION: u32 = 4;  // Must be > old version
```

### 8. Breaking Change Detection

Compares public function signatures:

```
Old functions:
  pub fn initialize(...)
  pub fn contribute(...)
  pub fn withdraw(...)

New functions:
  pub fn initialize(...)
  pub fn contribute(...)
  pub fn withdraw(...)
  pub fn update_metadata(...)  // New function - OK

Status: ✓ No breaking changes
```

## Writing Upgrade Tests

### Test File Structure

Create `contracts/crowdfund/tests/upgrade_tests.rs`:

```rust
#[cfg(test)]
mod upgrade_tests {
    use soroban_sdk::{Env, Address, Symbol, symbol_short};

    #[test]
    fn test_upgrade_preserves_state() {
        let env = Env::default();
        
        // Deploy old version
        let contract_id = env.register_contract(None, OldContract);
        
        // Initialize with test data
        let creator = Address::random(&env);
        let token = Address::random(&env);
        
        // ... initialization code ...
        
        // Simulate upgrade
        let new_wasm_hash = env.deployer().upload_contract_wasm(NEW_WASM);
        env.invoke_contract(
            &contract_id,
            &Symbol::new(&env, "upgrade"),
            soroban_sdk::vec![&env, new_wasm_hash],
        );
        
        // Verify state preserved
        let total_raised: i128 = env.invoke_contract(
            &contract_id,
            &Symbol::new(&env, "total_raised"),
            soroban_sdk::vec![&env],
        );
        
        assert_eq!(total_raised, expected_amount);
    }

    #[test]
    fn test_upgrade_new_functions() {
        let env = Env::default();
        
        // Deploy new version
        let contract_id = env.register_contract(None, NewContract);
        
        // Test new functionality
        // ...
    }

    #[test]
    fn test_data_migration() {
        // Test any data structure changes
        // Verify old data formats are handled
    }
}
```

### Migration Script Example

If data structure changes are needed:

```rust
// contracts/crowdfund/src/migration.rs
pub fn migrate_v3_to_v4(env: &Env) {
    // Read old data format
    let old_data = env.storage().instance().get::<_, OldFormat>(&KEY_DATA);
    
    // Transform to new format
    if let Some(old) = old_data {
        let new = NewFormat {
            field1: old.field1,
            field2: old.field2,
            field3: default_value(),  // New field
        };
        
        // Store new format
        env.storage().instance().set(&KEY_DATA, &new);
    }
}
```

## Upgrade Checklist

Before deploying an upgrade:

- [ ] All tests pass locally
- [ ] Contract upgrade tests pass in CI
- [ ] No breaking changes to public API
- [ ] Version number incremented
- [ ] Migration scripts tested
- [ ] Data integrity verified
- [ ] Testnet deployment successful
- [ ] Monitoring and alerts configured
- [ ] Rollback plan documented
- [ ] Users notified of changes

## Deployment Process

### 1. Testnet Deployment

```bash
# Build new contract
cargo build --release --target wasm32-unknown-unknown -p crowdfund

# Deploy to testnet
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/crowdfund.wasm \
  --source-account <account> \
  --network testnet

# Call upgrade function
stellar contract invoke \
  --id <contract-id> \
  --source-account <account> \
  --network testnet \
  -- upgrade \
  --new-wasm-hash <new-hash>
```

### 2. Verify Upgrade

```bash
# Check version
stellar contract invoke \
  --id <contract-id> \
  --network testnet \
  -- version

# Test functions
stellar contract invoke \
  --id <contract-id> \
  --network testnet \
  -- get_stats
```

### 3. Mainnet Deployment

After successful testnet testing:

```bash
# Deploy to mainnet
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/crowdfund.wasm \
  --source-account <account> \
  --network public

# Upgrade mainnet contract
stellar contract invoke \
  --id <mainnet-contract-id> \
  --source-account <account> \
  --network public \
  -- upgrade \
  --new-wasm-hash <new-hash>
```

## Monitoring Post-Upgrade

### Health Checks

```bash
# Monitor contract calls
stellar contract invoke \
  --id <contract-id> \
  --network public \
  -- get_stats

# Check error rates
# Monitor logs for upgrade-related errors
```

### Rollback Procedure

If issues occur:

```bash
# Deploy previous version
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/crowdfund_v3.wasm \
  --source-account <account> \
  --network public

# Upgrade back to previous version
stellar contract invoke \
  --id <contract-id> \
  --source-account <account> \
  --network public \
  -- upgrade \
  --new-wasm-hash <old-hash>
```

## Best Practices

1. **Semantic Versioning**
   - MAJOR: Breaking changes
   - MINOR: New features, backward compatible
   - PATCH: Bug fixes

2. **Backward Compatibility**
   - Keep old storage keys
   - Support old data formats
   - Provide migration path

3. **Testing**
   - Test upgrade path thoroughly
   - Test with real data if possible
   - Test rollback scenarios

4. **Communication**
   - Document all changes
   - Notify users of breaking changes
   - Provide migration guide

5. **Gradual Rollout**
   - Test on testnet first
   - Monitor closely after mainnet upgrade
   - Have quick rollback plan

## Troubleshooting

### Contract Size Exceeds Limit

```bash
# Check current size
wc -c target/wasm32-unknown-unknown/release/crowdfund.wasm

# Optimize WASM
cargo build --release --target wasm32-unknown-unknown -p crowdfund

# Use wasm-opt if available
wasm-opt -Oz -o optimized.wasm crowdfund.wasm
```

### Data Migration Fails

```bash
# Check storage state
stellar contract invoke \
  --id <contract-id> \
  -- get_stats

# Verify migration logic
cargo test --release --test '*migration*' -- --nocapture
```

### Version Mismatch

```bash
# Check deployed version
stellar contract invoke \
  --id <contract-id> \
  -- version

# Verify local version
grep 'CONTRACT_VERSION' contracts/crowdfund/src/lib.rs
```

## See Also

- [Contract Upgrades Guide](./contract-upgrades.md)
- [Testing Guide](./testing.md)
- [Deployment Guide](./deployment.md)
- [Soroban Documentation](https://soroban.stellar.org)
