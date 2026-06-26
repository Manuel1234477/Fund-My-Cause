/// RBAC validation functions for permission checks.
///
/// Provides validation functions that can be used in contract functions
/// to enforce permission-based access control.

use crate::rbac::*;
use crate::rbac_access::*;
use soroban_sdk::{Address, String};

/// Validate that an address has a specific permission.
///
/// # Arguments
/// * `actor` - The address requesting permission
/// * `permission` - The permission being requested
/// * `team_config` - The campaign's team configuration
///
/// # Returns
/// Result indicating success or error message
pub fn validate_permission(
    actor: &Address,
    permission: &Permission,
    team_config: &TeamConfig,
) -> Result<(), String> {
    let result = check_permission(actor, permission, team_config);

    if result.allowed {
        Ok(())
    } else {
        Err(result.reason)
    }
}

/// Validate that an address is the campaign owner.
///
/// # Arguments
/// * `actor` - The address to check
/// * `team_config` - The campaign's team configuration
///
/// # Returns
/// Result indicating success or error message
pub fn validate_owner(actor: &Address, team_config: &TeamConfig) -> Result<(), String> {
    if team_config.owner == *actor {
        Ok(())
    } else {
        Err(String::from_small_str("Only the owner can perform this action"))
    }
}

/// Validate that an address has editing permissions.
///
/// # Arguments
/// * `actor` - The address to check
/// * `team_config` - The campaign's team configuration
///
/// # Returns
/// Result indicating success or error message
pub fn validate_editor(actor: &Address, team_config: &TeamConfig) -> Result<(), String> {
    validate_permission(actor, &Permission::EditMetadata, team_config)
}

/// Validate that an address can manage team members.
///
/// # Arguments
/// * `actor` - The address to check
/// * `team_config` - The campaign's team configuration
///
/// # Returns
/// Result indicating success or error message
pub fn validate_team_manager(actor: &Address, team_config: &TeamConfig) -> Result<(), String> {
    validate_permission(actor, &Permission::ManageTeam, team_config)
}

/// Validate that an address can withdraw campaign funds.
///
/// # Arguments
/// * `actor` - The address to check
/// * `team_config` - The campaign's team configuration
///
/// # Returns
/// Result indicating success or error message
pub fn validate_can_withdraw(actor: &Address, team_config: &TeamConfig) -> Result<(), String> {
    validate_permission(actor, &Permission::WithdrawFunds, team_config)
}

/// Validate that an address can approve contributions.
///
/// # Arguments
/// * `actor` - The address to check
/// * `team_config` - The campaign's team configuration
///
/// # Returns
/// Result indicating success or error message
pub fn validate_can_approve_contributions(
    actor: &Address,
    team_config: &TeamConfig,
) -> Result<(), String> {
    validate_permission(actor, &Permission::ApproveContributions, team_config)
}

/// Validate that an address can update campaign status.
///
/// # Arguments
/// * `actor` - The address to check
/// * `team_config` - The campaign's team configuration
///
/// # Returns
/// Result indicating success or error message
pub fn validate_can_update_status(actor: &Address, team_config: &TeamConfig) -> Result<(), String> {
    validate_permission(actor, &Permission::UpdateStatus, team_config)
}

/// Validate that an address can configure campaign settings.
///
/// # Arguments
/// * `actor` - The address to check
/// * `team_config` - The campaign's team configuration
///
/// # Returns
/// Result indicating success or error message
pub fn validate_can_configure(actor: &Address, team_config: &TeamConfig) -> Result<(), String> {
    validate_permission(actor, &Permission::ConfigureSettings, team_config)
}

/// Validate that an address can manage delegations.
///
/// # Arguments
/// * `actor` - The address to check
/// * `team_config` - The campaign's team configuration
///
/// # Returns
/// Result indicating success or error message
pub fn validate_can_manage_delegations(
    actor: &Address,
    team_config: &TeamConfig,
) -> Result<(), String> {
    validate_permission(actor, &Permission::ManageDelegations, team_config)
}

/// Validate that an address can initiate multi-sig actions.
///
/// # Arguments
/// * `actor` - The address to check
/// * `team_config` - The campaign's team configuration
///
/// # Returns
/// Result indicating success or error message
pub fn validate_can_initiate_multisig(
    actor: &Address,
    team_config: &TeamConfig,
) -> Result<(), String> {
    validate_permission(actor, &Permission::InitiateMultiSig, team_config)
}

/// Validate that an address can approve multi-sig actions.
///
/// # Arguments
/// * `actor` - The address to check
/// * `team_config` - The campaign's team configuration
///
/// # Returns
/// Result indicating success or error message
pub fn validate_can_approve_multisig(
    actor: &Address,
    team_config: &TeamConfig,
) -> Result<(), String> {
    validate_permission(actor, &Permission::ApproveMultiSig, team_config)
}

/// Validate that an address can view analytics.
///
/// # Arguments
/// * `actor` - The address to check
/// * `team_config` - The campaign's team configuration
///
/// # Returns
/// Result indicating success or error message
pub fn validate_can_view_analytics(
    actor: &Address,
    team_config: &TeamConfig,
) -> Result<(), String> {
    validate_permission(actor, &Permission::ViewAnalytics, team_config)
}

/// Validate team member invitation parameters.
///
/// # Arguments
/// * `email` - The email/identifier of the invitee
/// * `role` - The role being assigned
/// * `expires_at` - When the role expires
///
/// # Returns
/// Result indicating success or validation errors
pub fn validate_invitation(
    email: &String,
    _role: &CampaignRole,
    expires_at: u64,
) -> Result<(), String> {
    // Validate email/identifier is not empty
    if email.len() == 0 {
        return Err(String::from_small_str("Email/identifier cannot be empty"));
    }

    // Validate email length
    if email.len() > 255 {
        return Err(String::from_small_str("Email/identifier is too long"));
    }

    // Validate expiration is in the future (if set)
    if expires_at > 0 {
        // This will be validated against current time in the contract
        // For now, just check it's reasonable (within 10 years)
        if expires_at > 315360000 {
            return Err(String::from_small_str("Expiration time is too far in the future"));
        }
    }

    Ok(())
}

/// Validate multi-sig configuration.
///
/// # Arguments
/// * `threshold` - Number of signatures required
/// * `signers` - List of signer addresses
///
/// # Returns
/// Result indicating success or validation errors
pub fn validate_multisig_config(threshold: u32, signers: &[Address]) -> Result<(), String> {
    // Check threshold is at least 1
    if threshold == 0 {
        return Err(String::from_small_str("Threshold must be at least 1"));
    }

    // Check threshold doesn't exceed number of signers
    if threshold as usize > signers.len() {
        return Err(String::from_small_str(
            "Threshold cannot exceed number of signers",
        ));
    }

    // Check there are no duplicate signers
    for i in 0..signers.len() {
        for j in (i + 1)..signers.len() {
            if signers[i] == signers[j] {
                return Err(String::from_small_str("Duplicate signers not allowed"));
            }
        }
    }

    Ok(())
}

/// Validate multi-sig action parameters.
///
/// # Arguments
/// * `action` - The multi-sig action
/// * `team_config` - The campaign's team configuration
///
/// # Returns
/// Result indicating success or validation errors
pub fn validate_multisig_action(
    action: &MultiSigAction,
    team_config: &TeamConfig,
) -> Result<(), String> {
    match action {
        MultiSigAction::Withdrawal { amount, recipient: _ } => {
            // Validate amount is positive
            if *amount <= 0 {
                return Err(String::from_small_str("Withdrawal amount must be positive"));
            }
            Ok(())
        }
        MultiSigAction::RemoveTeamMember { member } => {
            // Check member exists
            if find_team_member(member, team_config).is_none() {
                return Err(String::from_small_str("Team member not found"));
            }
            Ok(())
        }
        MultiSigAction::ChangeRole { member, new_role: _ } => {
            // Check member exists
            if find_team_member(member, team_config).is_none() {
                return Err(String::from_small_str("Team member not found"));
            }
            Ok(())
        }
        MultiSigAction::ChangeStatus { new_status } => {
            // Validate status is not empty
            if new_status.len() == 0 {
                return Err(String::from_small_str("Status cannot be empty"));
            }
            Ok(())
        }
        MultiSigAction::UpdateMultiSigConfig { threshold, signers } => {
            validate_multisig_config(*threshold, signers)
        }
    }
}

/// Validate delegation parameters.
///
/// # Arguments
/// * `delegator` - The original permission holder
/// * `delegatee` - The user receiving permissions
/// * `expires_at` - When the delegation expires
///
/// # Returns
/// Result indicating success or validation errors
pub fn validate_delegation(
    delegator: &Address,
    delegatee: &Address,
    expires_at: u64,
) -> Result<(), String> {
    // Check delegator and delegatee are different
    if delegator == delegatee {
        return Err(String::from_small_str(
            "Cannot delegate to yourself",
        ));
    }

    // Validate expiration if set
    if expires_at > 0 {
        if expires_at > 315360000 {
            return Err(String::from_small_str(
                "Expiration time is too far in the future",
            ));
        }
    }

    Ok(())
}

/// Validate role change parameters.
///
/// # Arguments
/// * `member` - The member whose role is changing
/// * `current_role` - The current role
/// * `new_role` - The new role being assigned
/// * `actor` - Who is making the change
/// * `team_config` - The campaign's team configuration
///
/// # Returns
/// Result indicating success or validation errors
pub fn validate_role_change(
    _member: &Address,
    _current_role: &CampaignRole,
    _new_role: &CampaignRole,
    actor: &Address,
    team_config: &TeamConfig,
) -> Result<(), String> {
    // Only Owner or Admin can change roles
    let permission_check = validate_permission(actor, &Permission::ManageTeam, team_config);

    if permission_check.is_err() {
        return Err(String::from_small_str(
            "Only Owner or Admin can change roles",
        ));
    }

    Ok(())
}
