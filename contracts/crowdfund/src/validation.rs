/// Validation logic for the crowdfund contract.
///
/// This module contains validation functions for campaign parameters and operations.

use crate::errors::ContractError;
use crate::types::Status;
use soroban_sdk::{Address, Env};

/// Validates campaign initialization parameters.
///
/// # Arguments
/// * `goal` - Campaign funding goal
/// * `deadline` - Campaign deadline timestamp
/// * `min_contribution` - Minimum contribution amount
/// * `max_contribution` - Maximum contribution amount
/// * `platform_fee_bps` - Platform fee in basis points
/// * `current_time` - Current ledger timestamp
///
/// # Returns
/// * `Ok(())` if all parameters are valid
/// * `Err(ContractError)` if any parameter is invalid
pub fn validate_initialization(
    goal: i128,
    deadline: u64,
    min_contribution: i128,
    max_contribution: i128,
    platform_fee_bps: Option<u32>,
    current_time: u64,
) -> Result<(), ContractError> {
    if goal <= 0 {
        return Err(ContractError::InvalidGoal);
    }
    if deadline <= current_time {
        return Err(ContractError::InvalidDeadline);
    }
    if min_contribution < 0 {
        return Err(ContractError::BelowMinimum);
    }
    if max_contribution < 0 || (max_contribution > 0 && max_contribution < min_contribution) {
        return Err(ContractError::ExceedsMaximum);
    }
    if let Some(fee_bps) = platform_fee_bps {
        if fee_bps > 10_000 {
            return Err(ContractError::InvalidFee);
        }
    }
    Ok(())
}

/// Validates a contribution amount.
///
/// # Arguments
/// * `amount` - Contribution amount
/// * `min_contribution` - Minimum allowed contribution
/// * `max_contribution` - Maximum allowed contribution per contributor
/// * `current_contribution` - Current total contribution by this address
///
/// # Returns
/// * `Ok(())` if amount is valid
/// * `Err(ContractError)` if amount is invalid
pub fn validate_contribution_amount(
    amount: i128,
    min_contribution: i128,
    max_contribution: i128,
    current_contribution: i128,
) -> Result<(), ContractError> {
    if amount < min_contribution {
        return Err(ContractError::BelowMinimum);
    }
    if max_contribution > 0 {
        let new_total = current_contribution
            .checked_add(amount)
            .ok_or(ContractError::Overflow)?;
        if new_total > max_contribution {
            return Err(ContractError::ExceedsMaximum);
        }
    }
    Ok(())
}

/// Validates campaign status for operations.
///
/// # Arguments
/// * `status` - Current campaign status
/// * `required_status` - Required status for the operation
///
/// # Returns
/// * `Ok(())` if status matches
/// * `Err(ContractError::NotActive)` if status doesn't match
pub fn validate_status(status: Status, required_status: Status) -> Result<(), ContractError> {
    if status != required_status {
        return Err(ContractError::NotActive);
    }
    Ok(())
}

/// Validates campaign deadline has passed.
///
/// # Arguments
/// * `current_time` - Current ledger timestamp
/// * `deadline` - Campaign deadline timestamp
///
/// # Returns
/// * `Ok(())` if deadline has passed
/// * `Err(ContractError::CampaignStillActive)` if deadline hasn't passed
pub fn validate_deadline_passed(current_time: u64, deadline: u64) -> Result<(), ContractError> {
    if current_time < deadline {
        return Err(ContractError::CampaignStillActive);
    }
    Ok(())
}

/// Validates campaign deadline hasn't passed.
///
/// # Arguments
/// * `current_time` - Current ledger timestamp
/// * `deadline` - Campaign deadline timestamp
///
/// # Returns
/// * `Ok(())` if deadline hasn't passed
/// * `Err(ContractError::CampaignEnded)` if deadline has passed
pub fn validate_deadline_not_passed(current_time: u64, deadline: u64) -> Result<(), ContractError> {
    if current_time >= deadline {
        return Err(ContractError::CampaignEnded);
    }
    Ok(())
}

/// Validates goal has been reached.
///
/// # Arguments
/// * `total_raised` - Total amount raised
/// * `goal` - Campaign goal
///
/// # Returns
/// * `Ok(())` if goal is reached
/// * `Err(ContractError::GoalNotReached)` if goal is not reached
pub fn validate_goal_reached(total_raised: i128, goal: i128) -> Result<(), ContractError> {
    if total_raised < goal {
        return Err(ContractError::GoalNotReached);
    }
    Ok(())
}

/// Validates goal has not been reached.
///
/// # Arguments
/// * `total_raised` - Total amount raised
/// * `goal` - Campaign goal
///
/// # Returns
/// * `Ok(())` if goal is not reached
/// * `Err(ContractError::GoalReached)` if goal is reached
pub fn validate_goal_not_reached(total_raised: i128, goal: i128) -> Result<(), ContractError> {
    if total_raised >= goal {
        return Err(ContractError::GoalReached);
    }
    Ok(())
}

/// Validates a new deadline is later than current deadline.
///
/// # Arguments
/// * `new_deadline` - Proposed new deadline
/// * `current_deadline` - Current deadline
///
/// # Returns
/// * `Ok(())` if new deadline is later
/// * `Err(ContractError::InvalidDeadline)` if new deadline is not later
pub fn validate_deadline_extension(new_deadline: u64, current_deadline: u64) -> Result<(), ContractError> {
    if new_deadline <= current_deadline {
        return Err(ContractError::InvalidDeadline);
    }
    Ok(())
}

/// Validates insurance fee configuration.
///
/// # Arguments
/// * `fee_bps` - Insurance fee in basis points
///
/// # Returns
/// * `Ok(())` if fee is valid
/// * `Err(ContractError::InvalidFee)` if fee is invalid
pub fn validate_insurance_fee(fee_bps: u32) -> Result<(), ContractError> {
    if fee_bps > 10_000 {
        return Err(ContractError::InvalidFee);
    }
    Ok(())
}

/// Validates recurring plan parameters.
///
/// # Arguments
/// * `amount` - Contribution amount
/// * `interval` - Interval in seconds
/// * `end_date` - End date timestamp
/// * `current_time` - Current ledger timestamp
///
/// # Returns
/// * `Ok(())` if parameters are valid
/// * `Err(ContractError::InvalidRecurringPlan)` if parameters are invalid
pub fn validate_recurring_plan(
    amount: i128,
    interval: u64,
    end_date: u64,
    current_time: u64,
) -> Result<(), ContractError> {
    if amount <= 0 || interval == 0 || end_date <= current_time {
        return Err(ContractError::InvalidRecurringPlan);
    }
    Ok(())
}

/// Validates delegation parameters.
///
/// # Arguments
/// * `amount` - Delegated amount
///
/// # Returns
/// * `Ok(())` if parameters are valid
/// * `Err(ContractError::InvalidDelegation)` if parameters are invalid
pub fn validate_delegation(amount: i128) -> Result<(), ContractError> {
    if amount <= 0 {
        return Err(ContractError::InvalidDelegation);
    }
    Ok(())
}

/// Validates partial refund amount.
///
/// # Arguments
/// * `refund_amount` - Amount to refund
/// * `total_contribution` - Total contribution by the address
///
/// # Returns
/// * `Ok(())` if refund is valid
/// * `Err(ContractError::RefundLimitExceeded)` if refund exceeds limit
pub fn validate_partial_refund(refund_amount: i128, total_contribution: i128) -> Result<(), ContractError> {
    if refund_amount > total_contribution / 2 {
        return Err(ContractError::RefundLimitExceeded);
    }
    Ok(())
}

/// Validates message length.
///
/// # Arguments
/// * `message_len` - Length of the message
///
/// # Returns
/// * `Ok(())` if message is valid
/// * `Err(ContractError::MessageTooLong)` if message is too long
pub fn validate_message_length(message_len: usize) -> Result<(), ContractError> {
    if message_len > 256 {
        return Err(ContractError::MessageTooLong);
    }
    Ok(())
}
