/// Role-Based Access Control (RBAC) system for team-based campaign management.
///
/// This module provides comprehensive role and permission management for campaigns,
/// including team member invitations, delegation, multi-signature support, and audit logging.

use soroban_sdk::{contracttype, Address, String, Vec, Map};

/// Campaign role enumeration.
///
/// Defines different roles with varying levels of campaign access and control.
#[derive(Clone, PartialEq, Debug)]
#[contracttype]
pub enum CampaignRole {
    /// Full campaign control (creator)
    Owner,
    /// Campaign management without fund access
    Admin,
    /// Content and metadata updates
    Editor,
    /// Read-only access to private campaign data
    Viewer,
    /// Special contributor privileges (can contribute without restrictions)
    Contributor,
}

/// Permission types for granular access control.
///
/// Represents specific actions that can be performed on a campaign.
#[derive(Clone, PartialEq, Debug)]
#[contracttype]
pub enum Permission {
    /// Create and initialize campaigns
    CreateCampaign,
    /// Edit campaign metadata and content
    EditMetadata,
    /// Manage team members and roles
    ManageTeam,
    /// Withdraw campaign funds
    WithdrawFunds,
    /// Approve or reject contributions
    ApproveContributions,
    /// Update campaign status (pause, resume, cancel)
    UpdateStatus,
    /// Configure campaign settings (fees, limits, etc.)
    ConfigureSettings,
    /// Manage delegations and permissions
    ManageDelegations,
    /// Initiate multi-signature actions
    InitiateMultiSig,
    /// Approve multi-signature actions
    ApproveMultiSig,
    /// View campaign analytics and reports
    ViewAnalytics,
    /// Manage milestones and releases
    ManageMilestones,
}

/// Team member information.
///
/// Tracks a team member's role, permissions, and engagement status.
#[derive(Clone)]
#[contracttype]
pub struct TeamMember {
    /// The team member's address
    pub address: Address,
    /// The member's role in the campaign
    pub role: CampaignRole,
    /// Timestamp when member was added to the team
    pub added_at: u64,
    /// Timestamp when member's role expires (0 = no expiration)
    pub expires_at: u64,
    /// Whether the member's access is active
    pub is_active: bool,
    /// Custom permissions override (empty = use role defaults)
    pub custom_permissions: Vec<Permission>,
}

/// Team configuration for a campaign.
///
/// Manages all team members and delegation settings for a campaign.
#[derive(Clone)]
#[contracttype]
pub struct TeamConfig {
    /// Campaign ID
    pub campaign_id: u64,
    /// Campaign owner
    pub owner: Address,
    /// List of all team members
    pub members: Vec<TeamMember>,
    /// Invitation codes for new members (code -> (address, role, expiry))
    pub pending_invitations: Vec<PendingInvitation>,
    /// Whether multi-signature approval is required for withdrawals
    pub multisig_required: bool,
    /// Number of signatures required for multi-sig actions (if enabled)
    pub multisig_threshold: u32,
    /// Addresses that can approve multi-sig actions
    pub multisig_signers: Vec<Address>,
}

/// Pending invitation for a new team member.
///
/// Represents an invitation sent to a user who hasn't yet joined the team.
#[derive(Clone)]
#[contracttype]
pub struct PendingInvitation {
    /// Unique invitation code
    pub code: String,
    /// Email or identifier for the invitee
    pub invitee: String,
    /// Proposed role for the invitee
    pub role: CampaignRole,
    /// Timestamp when invitation was created
    pub created_at: u64,
    /// Timestamp when invitation expires (0 = no expiration)
    pub expires_at: u64,
    /// Whether the invitation has been accepted
    pub accepted: bool,
}

/// Delegation information for role-based permissions.
///
/// Allows a team member to temporarily delegate their permissions to another user.
#[derive(Clone)]
#[contracttype]
pub struct RoleDelegate {
    /// The original permission holder
    pub delegator: Address,
    /// The user receiving delegated permissions
    pub delegatee: Address,
    /// Role being delegated
    pub role: CampaignRole,
    /// Permissions being delegated
    pub permissions: Vec<Permission>,
    /// Timestamp when delegation becomes active
    pub active_at: u64,
    /// Timestamp when delegation expires
    pub expires_at: u64,
    /// Reason for delegation
    pub reason: String,
    /// Whether this delegation is active
    pub is_active: bool,
}

/// Multi-signature approval request.
///
/// Tracks multi-signature requests for critical campaign actions.
#[derive(Clone, PartialEq, Debug)]
#[contracttype]
pub enum MultiSigAction {
    /// Withdrawal of campaign funds
    Withdrawal {
        amount: i128,
        recipient: Address,
    },
    /// Team member removal
    RemoveTeamMember { member: Address },
    /// Role change for team member
    ChangeRole {
        member: Address,
        new_role: CampaignRole,
    },
    /// Campaign status change
    ChangeStatus { new_status: String },
    /// Update multisig configuration
    UpdateMultiSigConfig {
        threshold: u32,
        signers: Vec<Address>,
    },
}

/// Multi-signature approval record.
///
/// Tracks approvals for a multi-sig action.
#[derive(Clone)]
#[contracttype]
pub struct MultiSigApproval {
    /// Unique request ID
    pub request_id: u64,
    /// The action requiring approval
    pub action: MultiSigAction,
    /// Address of who initiated the request
    pub initiator: Address,
    /// Timestamp when request was created
    pub created_at: u64,
    /// Timestamp when request expires
    pub expires_at: u64,
    /// Addresses that have approved
    pub approvers: Vec<Address>,
    /// Number of approvals needed
    pub threshold_required: u32,
    /// Current status of the request
    pub status: MultiSigStatus,
}

/// Status of a multi-signature approval request.
#[derive(Clone, PartialEq, Debug)]
#[contracttype]
pub enum MultiSigStatus {
    /// Pending approvals
    Pending,
    /// Approved and ready to execute
    Approved,
    /// Execution completed
    Executed,
    /// Request expired or rejected
    Cancelled,
}

/// Audit log entry for role-based actions.
///
/// Records all role-based access control actions for transparency and security.
#[derive(Clone)]
#[contracttype]
pub struct RBACauditLog {
    /// Unique log entry ID
    pub entry_id: u64,
    /// Campaign ID
    pub campaign_id: u64,
    /// The actor performing the action
    pub actor: Address,
    /// The type of action performed
    pub action: RBACAction,
    /// Timestamp when action occurred
    pub timestamp: u64,
    /// Additional details about the action
    pub details: String,
    /// Whether the action succeeded
    pub success: bool,
}

/// Types of RBAC actions that can be audited.
#[derive(Clone, PartialEq, Debug)]
#[contracttype]
pub enum RBACAction {
    /// Team member added
    MemberAdded,
    /// Team member removed
    MemberRemoved,
    /// Role changed
    RoleChanged,
    /// Permission granted
    PermissionGranted,
    /// Permission revoked
    PermissionRevoked,
    /// Delegation created
    DelegationCreated,
    /// Delegation revoked
    DelegationRevoked,
    /// Multi-sig request initiated
    MultiSigInitiated,
    /// Multi-sig approval granted
    MultiSigApproved,
    /// Multi-sig executed
    MultiSigExecuted,
    /// Access denied (unauthorized attempt)
    AccessDenied,
}

/// Role inheritance hierarchy.
///
/// Defines which permissions are inherited by each role.
#[derive(Clone)]
#[contracttype]
pub struct RoleHierarchy {
    /// Role in the hierarchy
    pub role: CampaignRole,
    /// Permissions for this role
    pub permissions: Vec<Permission>,
    /// Parent roles from which permissions are inherited
    pub inherited_from: Vec<CampaignRole>,
}

/// Time-based role expiration information.
///
/// Tracks time-limited role assignments.
#[derive(Clone)]
#[contracttype]
pub struct RoleExpiration {
    /// Campaign ID
    pub campaign_id: u64,
    /// Team member address
    pub member: Address,
    /// Role being tracked
    pub role: CampaignRole,
    /// Timestamp when role becomes active
    pub start_time: u64,
    /// Timestamp when role expires
    pub end_time: u64,
    /// Whether the role is currently active
    pub is_active: bool,
    /// Number of days remaining (if not expired)
    pub days_remaining: u32,
}

/// Permission result with details.
///
/// Returned from permission checks to indicate allowed/denied status.
#[derive(Clone, Debug)]
#[contracttype]
pub struct PermissionResult {
    /// Whether the permission is granted
    pub allowed: bool,
    /// Reason if denied
    pub reason: String,
    /// The role that was checked
    pub role: CampaignRole,
    /// Permissions available to this role
    pub available_permissions: Vec<Permission>,
}

/// Role-based access event.
#[derive(Clone)]
#[contracttype]
pub struct EventRBACTeamMemberAdded {
    /// Campaign ID
    pub campaign_id: u64,
    /// New team member address
    pub member: Address,
    /// Assigned role
    pub role: CampaignRole,
    /// When role expires (0 = never)
    pub expires_at: u64,
    /// Timestamp of event
    pub timestamp: u64,
}

/// Role change event.
#[derive(Clone)]
#[contracttype]
pub struct EventRBACRoleChanged {
    /// Campaign ID
    pub campaign_id: u64,
    /// Team member address
    pub member: Address,
    /// Previous role
    pub from_role: CampaignRole,
    /// New role
    pub to_role: CampaignRole,
    /// Timestamp of event
    pub timestamp: u64,
}

/// Team member removal event.
#[derive(Clone)]
#[contracttype]
pub struct EventRBACTeamMemberRemoved {
    /// Campaign ID
    pub campaign_id: u64,
    /// Removed member address
    pub member: Address,
    /// Their previous role
    pub role: CampaignRole,
    /// Reason for removal
    pub reason: String,
    /// Timestamp of event
    pub timestamp: u64,
}

/// Delegation created event.
#[derive(Clone)]
#[contracttype]
pub struct EventRBACDelegationCreated {
    /// Campaign ID
    pub campaign_id: u64,
    /// Original permission holder
    pub delegator: Address,
    /// Permission recipient
    pub delegatee: Address,
    /// Delegated role
    pub role: CampaignRole,
    /// Expiration timestamp
    pub expires_at: u64,
    /// Timestamp of event
    pub timestamp: u64,
}

/// Delegation revoked event.
#[derive(Clone)]
#[contracttype]
pub struct EventRBACDelegationRevoked {
    /// Campaign ID
    pub campaign_id: u64,
    /// Original permission holder
    pub delegator: Address,
    /// Permission recipient
    pub delegatee: Address,
    /// Previously delegated role
    pub role: CampaignRole,
    /// Timestamp of event
    pub timestamp: u64,
}

/// Multi-signature approval initiated event.
#[derive(Clone)]
#[contracttype]
pub struct EventRBACMultiSigInitiated {
    /// Campaign ID
    pub campaign_id: u64,
    /// Multi-sig request ID
    pub request_id: u64,
    /// Action being requested
    pub action_type: String,
    /// Who initiated it
    pub initiator: Address,
    /// Approvals needed
    pub threshold: u32,
    /// Timestamp of event
    pub timestamp: u64,
}

/// Multi-signature approval granted event.
#[derive(Clone)]
#[contracttype]
pub struct EventRBACMultiSigApproved {
    /// Campaign ID
    pub campaign_id: u64,
    /// Multi-sig request ID
    pub request_id: u64,
    /// Who approved
    pub approver: Address,
    /// Current approval count
    pub approvals_count: u32,
    /// Threshold required
    pub threshold: u32,
    /// Timestamp of event
    pub timestamp: u64,
}

/// Multi-signature action executed event.
#[derive(Clone)]
#[contracttype]
pub struct EventRBACMultiSigExecuted {
    /// Campaign ID
    pub campaign_id: u64,
    /// Multi-sig request ID
    pub request_id: u64,
    /// Action that was executed
    pub action_type: String,
    /// Timestamp of event
    pub timestamp: u64,
}

/// Access denied event (audit trail).
#[derive(Clone)]
#[contracttype]
pub struct EventRBACAccessDenied {
    /// Campaign ID
    pub campaign_id: u64,
    /// Who attempted access
    pub actor: Address,
    /// What action was attempted
    pub attempted_action: String,
    /// Reason for denial
    pub reason: String,
    /// Timestamp of event
    pub timestamp: u64,
}
