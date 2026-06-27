//! Security module for the crowdfund contract.
//!
//! ## Checks-Effects-Interactions (CEI) Safety Model
//!
//! All state-mutating entrypoints in `lib.rs` follow the CEI pattern to prevent
//! reentrancy and ensure atomicity:
//!
//! 1. **Checks** — validate all preconditions (status, auth, amounts, deadlines)
//!    before touching any state.
//! 2. **Effects** — write every state change (storage updates, counter increments)
//!    before any external call.
//! 3. **Interactions** — perform token transfers (external calls) only after all
//!    internal state is finalised.
//!
//! ### Entrypoint audit
//!
//! | Function                   | CEI order         | Notes                                        |
//! |----------------------------|-------------------|----------------------------------------------|
//! | `contribute`               | ✅ checks→effects→transfer | Transfer after all storage writes.  |
//! | `withdraw`                 | ✅ checks→effects→transfer | Status set to `Successful`, total zeroed, then transfer. |
//! | `refund_single`            | ✅ checks→effects→transfer | Contribution zeroed before transfer.         |
//! | `refund_batch`             | ✅ checks→effects→transfer | Each contribution zeroed before its transfer.|
//! | `refund_partial`           | ✅ checks→effects→transfer | Balance decremented then transfer.           |
//! | `execute_emergency_withdrawal` | ✅ checks→effects→transfer | Total zeroed before transfer.           |
//! | `contribute_on_behalf`     | ✅ checks→effects→transfer | All writes before transfer.                  |
//! | `setup_matching`           | ✅ checks→effects→transfer | Config written before sponsor transfer-in.   |
//! | `claim_insurance_payout`   | ✅ checks→effects→transfer | Fee record zeroed, pool decremented before transfer. |
//! | `claim_yield`              | ✅ checks→effects→transfer | Accounting updated before transfer.          |
//! | `distribute_rewards`       | ✅ checks→effects→transfer | Claimed amount recorded before transfer.     |
//!
//! ### Reentrancy
//!
//! Soroban's execution model is single-threaded and contracts cannot be re-entered
//! mid-execution via the token transfer mechanism (token contracts are separate
//! Wasm instances and cannot call back into the crowdfund contract during a
//! transfer).  The `ReentrancyGuard` struct is available as an additional
//! defence-in-depth layer for any future entrypoints that may be susceptible.
//!
//! ### Malicious Token Defence
//!
//! A malicious token contract that panics, loops, or lies about balances can
//! cause a transaction to abort.  Because all effects are written before the
//! external transfer call, an aborted transaction rolls back the entire ledger
//! change — no partial state corruption is possible.  See `adversarial.rs` for
//! tests that verify this property.

use crate::errors::ContractError;
use crate::storage;
use soroban_sdk::{Address, Env, Vec};

const REENTRANCY_GUARD_LOCK: u32 = 1;
const REENTRANCY_GUARD_UNLOCKED: u32 = 0;

/// Reentrancy protection guard using the state machine pattern.
pub struct ReentrancyGuard;

impl ReentrancyGuard {
    /// Acquires the reentrancy lock.
    ///
    /// # Returns
    /// * `Ok(())` if lock acquired successfully
    /// * `Err(ContractError::ReentrancyDetected)` if already locked
    pub fn acquire(env: &Env) -> Result<(), ContractError> {
        let current = env
            .storage()
            .instance()
            .get::<_, u32>(&storage::KEY_REENTRANCY_LOCK)
            .unwrap_or(REENTRANCY_GUARD_UNLOCKED);

        if current == REENTRANCY_GUARD_LOCK {
            return Err(ContractError::ReentrancyDetected);
        }

        env.storage()
            .instance()
            .set(&storage::KEY_REENTRANCY_LOCK, &REENTRANCY_GUARD_LOCK);
        Ok(())
    }

    /// Releases the reentrancy lock.
    pub fn release(env: &Env) {
        env.storage()
            .instance()
            .set(&storage::KEY_REENTRANCY_LOCK, &REENTRANCY_GUARD_UNLOCKED);
    }
}

/// Circuit breaker pattern for emergency stops.
pub struct CircuitBreaker;

impl CircuitBreaker {
    /// Checks if the circuit is broken (emergency pause is active).
    ///
    /// # Returns
    /// * `true` if emergency pause is active
    /// * `false` otherwise
    pub fn is_broken(env: &Env) -> bool {
        env.storage()
            .instance()
            .get::<_, bool>(&storage::KEY_EMERGENCY_PAUSE)
            .unwrap_or(false)
    }

    /// Enforces circuit breaker. Returns error if broken.
    pub fn enforce(env: &Env) -> Result<(), ContractError> {
        if Self::is_broken(env) {
            return Err(ContractError::EmergencyPauseActive);
        }
        Ok(())
    }

    /// Trips the circuit breaker (activates emergency pause).
    pub fn trip(env: &Env, admin: &Address) -> Result<(), ContractError> {
        let contract_admin = storage::get_admin(env)?;
        if admin != &contract_admin {
            return Err(ContractError::Unauthorized);
        }
        env.storage()
            .instance()
            .set(&storage::KEY_EMERGENCY_PAUSE, &true);
        Ok(())
    }

    /// Resets the circuit breaker (deactivates emergency pause).
    pub fn reset(env: &Env, admin: &Address) -> Result<(), ContractError> {
        let contract_admin = storage::get_admin(env)?;
        if admin != &contract_admin {
            return Err(ContractError::Unauthorized);
        }
        env.storage()
            .instance()
            .set(&storage::KEY_EMERGENCY_PAUSE, &false);
        Ok(())
    }
}

/// Rate limiting control for sensitive operations.
pub struct RateLimiter;

impl RateLimiter {
    /// Checks if an address can perform an operation given the rate limit.
    ///
    /// # Arguments
    /// * `env` - Soroban environment
    /// * `addr` - Address to check
    /// * `max_ops_per_ledger` - Maximum operations allowed per ledger
    ///
    /// # Returns
    /// * `Ok(())` if operation is allowed
    /// * `Err(ContractError::RateLimitExceeded)` if limit exceeded
    pub fn check(env: &Env, addr: &Address, max_ops_per_ledger: u32) -> Result<(), ContractError> {
        let current_ledger = env.ledger().sequence();
        let key = storage::make_rate_limit_key(addr);

        let (last_ledger, count): (u64, u32) = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or((0, 0));

        // Reset count if we're in a new ledger
        let (new_ledger, new_count) = if last_ledger < current_ledger {
            (current_ledger, 1)
        } else if count >= max_ops_per_ledger {
            return Err(ContractError::RateLimitExceeded);
        } else {
            (current_ledger, count + 1)
        };

        env.storage()
            .persistent()
            .set(&key, &(new_ledger, new_count));
        Ok(())
    }
}

/// Input sanitization helpers.
pub struct InputValidator;

impl InputValidator {
    /// Validates that a string is within acceptable length bounds.
    ///
    /// # Arguments
    /// * `input` - String to validate
    /// * `max_length` - Maximum allowed length
    ///
    /// # Returns
    /// * `Ok(())` if string is valid
    /// * `Err(ContractError::InvalidInput)` if string is too long
    pub fn validate_string_length(input: &str, max_length: usize) -> Result<(), ContractError> {
        if input.len() > max_length {
            return Err(ContractError::InvalidInput);
        }
        Ok(())
    }

    /// Validates that an amount is within reasonable bounds.
    ///
    /// # Arguments
    /// * `amount` - Amount to validate
    /// * `max_amount` - Maximum allowed amount (set to i128::MAX to disable)
    ///
    /// # Returns
    /// * `Ok(())` if amount is valid
    /// * `Err(ContractError::InvalidInput)` if amount exceeds bounds
    pub fn validate_amount(amount: i128, max_amount: i128) -> Result<(), ContractError> {
        if amount < 0 || amount > max_amount {
            return Err(ContractError::InvalidInput);
        }
        Ok(())
    }

    /// Validates an address list for duplicates.
    ///
    /// # Arguments
    /// * `addresses` - Vector of addresses to validate
    ///
    /// # Returns
    /// * `Ok(())` if no duplicates
    /// * `Err(ContractError::InvalidInput)` if duplicates found
    pub fn validate_no_duplicates(addresses: &Vec<Address>) -> Result<(), ContractError> {
        let len = addresses.len();
        for i in 0..len {
            for j in (i + 1)..len {
                if &addresses.get(i).unwrap() == &addresses.get(j).unwrap() {
                    return Err(ContractError::InvalidInput);
                }
            }
        }
        Ok(())
    }
}

/// Access control helpers.
pub struct AccessControl;

impl AccessControl {
    /// Requires that the caller is the contract admin.
    ///
    /// # Arguments
    /// * `caller` - The caller's address
    /// * `admin` - The admin's address
    ///
    /// # Returns
    /// * `Ok(())` if caller is admin
    /// * `Err(ContractError::Unauthorized)` otherwise
    pub fn require_admin(caller: &Address, admin: &Address) -> Result<(), ContractError> {
        if caller != admin {
            return Err(ContractError::Unauthorized);
        }
        Ok(())
    }

    /// Requires that the caller is the campaign creator.
    ///
    /// # Arguments
    /// * `caller` - The caller's address
    /// * `creator` - The creator's address
    ///
    /// # Returns
    /// * `Ok(())` if caller is creator
    /// * `Err(ContractError::Unauthorized)` otherwise
    pub fn require_creator(caller: &Address, creator: &Address) -> Result<(), ContractError> {
        if caller != creator {
            return Err(ContractError::Unauthorized);
        }
        Ok(())
    }

    /// Checks if an address is in a whitelist.
    ///
    /// # Arguments
    /// * `env` - Soroban environment
    /// * `addr` - Address to check
    /// * `whitelist` - Vector of whitelisted addresses
    ///
    /// # Returns
    /// * `true` if address is whitelisted
    /// * `false` otherwise
    pub fn is_whitelisted(addr: &Address, whitelist: &Vec<Address>) -> bool {
        for i in 0..whitelist.len() {
            if &whitelist.get(i).unwrap() == addr {
                return true;
            }
        }
        false
    }

    /// Checks if an address is in a blacklist.
    ///
    /// # Arguments
    /// * `env` - Soroban environment
    /// * `addr` - Address to check
    /// * `blacklist` - Vector of blacklisted addresses
    ///
    /// # Returns
    /// * `true` if address is blacklisted
    /// * `false` otherwise
    pub fn is_blacklisted(addr: &Address, blacklist: &Vec<Address>) -> bool {
        for i in 0..blacklist.len() {
            if &blacklist.get(i).unwrap() == addr {
                return true;
            }
        }
        false
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_input_validator_string_length() {
        assert!(InputValidator::validate_string_length("hello", 10).is_ok());
        assert!(InputValidator::validate_string_length("hello", 5).is_ok());
        assert!(InputValidator::validate_string_length("hello", 4).is_err());
    }

    #[test]
    fn test_input_validator_amount() {
        assert!(InputValidator::validate_amount(100, 1000).is_ok());
        assert!(InputValidator::validate_amount(-1, 1000).is_err());
        assert!(InputValidator::validate_amount(1001, 1000).is_err());
    }
}
