/// Access control functions for RBAC system.
///
/// Provides functions for checking permissions, managing team members,
/// handling delegations, and multi-signature approvals.

use crate::rbac::*;
use soroban_sdk::{Address, String, Vec};

/// Check if an address has a specific permission for a campaign.
///
/// # Arguments
/// * `member_address` - The address to check
/// * `permission` - The permission to verify
/// * `team_config` - The campaign's team configuration
///
/// # Returns
/// `PermissionResult` indicating if permission is granted
pub fn check_permission(
    member_address: &Address,
    permission: &Permission,
    team_config: &TeamConfig,
) -> PermissionResult {
    // Check if member exists and is active
    let member = find_team_member(member_address, team_config);

    match member {
        Some(member_info) => {
            if !member_info.is_active {
                return PermissionResult {
                    allowed: false,
                    reason: String::from_small_str("Member account is inactive"),
                    role: member_info.role.clone(),
                    available_permissions: Vec::new(),
                };
            }

            // Check if role has expired
            if member_info.expires_at > 0 && current_timestamp() > member_info.expires_at {
                return PermissionResult {
                    allowed: false,
                    reason: String::from_small_str("Member role has expired"),
                    role: member_info.role.clone(),
                    available_permissions: Vec::new(),
                };
            }

            // Get role permissions
            let role_permissions = get_role_permissions(&member_info.role);

            // Check custom permissions
            let mut has_permission = role_permissions.iter().any(|p| p == permission);

            if !has_permission && member_info.custom_permissions.len() > 0 {
                has_permission = member_info
                    .custom_permissions
                    .iter()
                    .any(|p| p == permission);
            }

            PermissionResult {
                allowed: has_permission,
                reason: if has_permission {
                    String::from_small_str("Permission granted")
                } else {
                    String::from_small_str("Permission denied")
                },
                role: member_info.role.clone(),
                available_permissions: role_permissions,
            }
        }
        None => PermissionResult {
            allowed: false,
            reason: String::from_small_str("Member not found in team"),
            role: CampaignRole::Viewer,
            available_permissions: get_role_permissions(&CampaignRole::Viewer),
        },
    }
}

/// Get all permissions for a specific role.
///
/// # Arguments
/// * `role` - The campaign role
///
/// # Returns
/// Vector of permissions available to this role
pub fn get_role_permissions(role: &CampaignRole) -> Vec<Permission> {
    match role {
        CampaignRole::Owner => vec![
            Permission::CreateCampaign,
            Permission::EditMetadata,
            Permission::ManageTeam,
            Permission::WithdrawFunds,
            Permission::ApproveContributions,
            Permission::UpdateStatus,
            Permission::ConfigureSettings,
            Permission::ManageDelegations,
            Permission::InitiateMultiSig,
            Permission::ApproveMultiSig,
            Permission::ViewAnalytics,
            Permission::ManageMilestones,
        ],
        CampaignRole::Admin => vec![
            Permission::EditMetadata,
            Permission::ManageTeam,
            Permission::ApproveContributions,
            Permission::UpdateStatus,
            Permission::ConfigureSettings,
            Permission::ManageDelegations,
            Permission::InitiateMultiSig,
            Permission::ApproveMultiSig,
            Permission::ViewAnalytics,
            Permission::ManageMilestones,
        ],
        CampaignRole::Editor => vec![
            Permission::EditMetadata,
            Permission::ViewAnalytics,
            Permission::ManageMilestones,
        ],
        CampaignRole::Viewer => vec![Permission::ViewAnalytics],
        CampaignRole::Contributor => vec![
            Permission::ViewAnalytics,
            Permission::ApproveContributions,
        ],
    }
}

/// Find a team member by address.
///
/// # Arguments
/// * `address` - The address to search for
/// * `team_config` - The team configuration
///
/// # Returns
/// Option containing the TeamMember if found
pub fn find_team_member(address: &Address, team_config: &TeamConfig) -> Option<TeamMember> {
    team_config
        .members
        .iter()
        .find(|m| m.address == *address)
        .cloned()
}

/// Add a team member to a campaign.
///
/// # Arguments
/// * `address` - The address to add
/// * `role` - The role to assign
/// * `expires_at` - When the role expires (0 = never)
/// * `team_config` - The team configuration to update
pub fn add_team_member(
    address: Address,
    role: CampaignRole,
    expires_at: u64,
    team_config: &mut TeamConfig,
) -> Result<(), String> {
    // Check if member already exists
    if find_team_member(&address, team_config).is_some() {
        return Err(String::from_small_str("Member already exists"));
    }

    let member = TeamMember {
        address,
        role,
        added_at: current_timestamp(),
        expires_at,
        is_active: true,
        custom_permissions: Vec::new(),
    };

    team_config.members.push(member);
    Ok(())
}

/// Remove a team member from a campaign.
///
/// # Arguments
/// * `address` - The address to remove
/// * `team_config` - The team configuration to update
pub fn remove_team_member(address: &Address, team_config: &mut TeamConfig) -> Result<(), String> {
    let initial_len = team_config.members.len();

    // Remove the member
    team_config.members = team_config
        .members
        .iter()
        .filter(|m| m.address != *address)
        .cloned()
        .collect();

    if team_config.members.len() < initial_len {
        Ok(())
    } else {
        Err(String::from_small_str("Member not found"))
    }
}

/// Change a team member's role.
///
/// # Arguments
/// * `address` - The member's address
/// * `new_role` - The new role to assign
/// * `team_config` - The team configuration to update
pub fn change_role(
    address: &Address,
    new_role: CampaignRole,
    team_config: &mut TeamConfig,
) -> Result<(), String> {
    for member in team_config.members.iter_mut() {
        if member.address == *address {
            member.role = new_role;
            return Ok(());
        }
    }
    Err(String::from_small_str("Member not found"))
}

/// Create a delegation of permissions.
///
/// # Arguments
/// * `delegator` - The original permission holder
/// * `delegatee` - The user receiving permissions
/// * `role` - The role being delegated
/// * `permissions` - The specific permissions to delegate
/// * `expires_at` - When the delegation expires
pub fn create_delegation(
    delegator: Address,
    delegatee: Address,
    role: CampaignRole,
    permissions: Vec<Permission>,
    expires_at: u64,
) -> RoleDelegate {
    RoleDelegate {
        delegator,
        delegatee,
        role,
        permissions,
        active_at: current_timestamp(),
        expires_at,
        reason: String::from_small_str(""),
        is_active: true,
    }
}

/// Check if a delegation is currently active.
///
/// # Arguments
/// * `delegation` - The delegation to check
///
/// # Returns
/// True if the delegation is active and not expired
pub fn is_delegation_active(delegation: &RoleDelegate) -> bool {
    if !delegation.is_active {
        return false;
    }

    let now = current_timestamp();
    now >= delegation.active_at && (delegation.expires_at == 0 || now <= delegation.expires_at)
}

/// Revoke a delegation.
///
/// # Arguments
/// * `delegation` - The delegation to revoke
pub fn revoke_delegation(delegation: &mut RoleDelegate) {
    delegation.is_active = false;
}

/// Create a multi-signature approval request.
///
/// # Arguments
/// * `action` - The action requiring approval
/// * `initiator` - Who is requesting approval
/// * `threshold` - Number of signatures required
/// * `signers` - Addresses that can approve
pub fn create_multisig_request(
    action: MultiSigAction,
    initiator: Address,
    threshold: u32,
    signers: &[Address],
) -> MultiSigApproval {
    MultiSigApproval {
        request_id: generate_request_id(),
        action,
        initiator,
        created_at: current_timestamp(),
        expires_at: current_timestamp() + 7 * 24 * 60 * 60, // 7 days
        approvers: Vec::new(),
        threshold_required: threshold,
        status: MultiSigStatus::Pending,
    }
}

/// Add an approval to a multi-sig request.
///
/// # Arguments
/// * `approval` - The multi-sig approval to update
/// * `approver` - The address approving
///
/// # Returns
/// True if approval was added, false if already approved
pub fn add_approval(approval: &mut MultiSigApproval, approver: Address) -> bool {
    // Check if already approved
    if approval.approvers.iter().any(|a| a == approver) {
        return false;
    }

    // Check if expired
    if current_timestamp() > approval.expires_at {
        approval.status = MultiSigStatus::Cancelled;
        return false;
    }

    approval.approvers.push(approver);

    // Check if threshold reached
    if approval.approvers.len() >= approval.threshold_required as usize {
        approval.status = MultiSigStatus::Approved;
    }

    true
}

/// Check if a multi-sig request has been fully approved.
///
/// # Arguments
/// * `approval` - The multi-sig approval to check
///
/// # Returns
/// True if the request has reached the required threshold
pub fn is_multisig_approved(approval: &MultiSigApproval) -> bool {
    approval.approvers.len() >= approval.threshold_required as usize
}

/// Execute a multi-sig action.
///
/// # Arguments
/// * `approval` - The multi-sig approval to execute
///
/// # Returns
/// Result indicating success or failure
pub fn execute_multisig_action(approval: &mut MultiSigApproval) -> Result<(), String> {
    if approval.status != MultiSigStatus::Approved {
        return Err(String::from_small_str(
            "Not all required approvals have been granted",
        ));
    }

    if current_timestamp() > approval.expires_at {
        approval.status = MultiSigStatus::Cancelled;
        return Err(String::from_small_str("Multi-sig request has expired"));
    }

    approval.status = MultiSigStatus::Executed;
    Ok(())
}

/// Log a RBAC audit event.
///
/// # Arguments
/// * `campaign_id` - The campaign ID
/// * `actor` - Who performed the action
/// * `action` - The type of action
/// * `details` - Additional details
/// * `success` - Whether the action succeeded
///
/// # Returns
/// The created audit log entry
pub fn log_rbac_action(
    campaign_id: u64,
    actor: Address,
    action: RBACAction,
    details: String,
    success: bool,
) -> RBACauditLog {
    RBACauditLog {
        entry_id: generate_log_entry_id(),
        campaign_id,
        actor,
        action,
        timestamp: current_timestamp(),
        details,
        success,
    }
}

/// Verify if an action requires multi-signature approval.
///
/// # Arguments
/// * `action_type` - The type of action
/// * `team_config` - The team configuration
///
/// # Returns
/// True if multi-sig is required for this action
pub fn requires_multisig(action_type: &str, team_config: &TeamConfig) -> bool {
    if !team_config.multisig_required {
        return false;
    }

    // Always require multi-sig for withdrawals and critical actions
    matches!(action_type, "withdrawal" | "remove_member" | "change_role")
}

/// Get active role expirations for a campaign.
///
/// # Arguments
/// * `campaign_id` - The campaign ID
/// * `members` - The team members
///
/// # Returns
/// Vector of RoleExpiration records
pub fn get_role_expirations(campaign_id: u64, members: &[TeamMember]) -> Vec<RoleExpiration> {
    let now = current_timestamp();
    members
        .iter()
        .filter_map(|m| {
            if m.expires_at == 0 || m.expires_at <= now {
                None
            } else {
                let days_remaining = ((m.expires_at - now) / 86400) as u32;
                Some(RoleExpiration {
                    campaign_id,
                    member: m.address.clone(),
                    role: m.role.clone(),
                    start_time: m.added_at,
                    end_time: m.expires_at,
                    is_active: m.is_active && days_remaining > 0,
                    days_remaining,
                })
            }
        })
        .collect()
}

// Helper functions

/// Get current timestamp.
fn current_timestamp() -> u64 {
    // This will be implemented by the contract using soroban_sdk's ledger functions
    // For now, return 0 as placeholder
    0
}

/// Generate a unique request ID for multi-sig requests.
fn generate_request_id() -> u64 {
    // This will be implemented to generate unique IDs
    // For now, return a placeholder
    1
}

/// Generate a unique log entry ID.
fn generate_log_entry_id() -> u64 {
    // This will be implemented to generate unique IDs
    // For now, return a placeholder
    1
}
