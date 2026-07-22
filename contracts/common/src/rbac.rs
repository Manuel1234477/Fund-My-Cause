//! Generic, role-set-agnostic team-RBAC engine.
//!
//! Generalizes the team/role/permission model that `crowdfund` sketched in
//! its `rbac.rs` / `rbac_access.rs` / `rbac_validation.rs` files. Those files
//! were never wired into `crowdfund`'s module tree (no `mod rbac;` etc.) and
//! did not compile against the pinned `soroban-sdk` API — see the crate
//! README for the full extraction decision. This module is a working,
//! generalized replacement: it is generic over a contract-defined role type
//! `R` and permission type `P`, so `contracts/common` itself stays agnostic
//! of any specific role or permission set. A contract that needs role-based,
//! multi-member access control (e.g. a future `registry` authorization
//! layer) defines its own concrete `Role`/`Permission` enums — each
//! `#[contracttype]` so they can be persisted — and drives this engine with
//! them.

use soroban_sdk::{Address, Env, IntoVal, TryFromVal, Val, Vec};

use crate::error::CommonError;

/// A single team member's role assignment.
///
/// Generic over the contract-defined role type `R`. This is a plain Rust
/// struct, not a `#[contracttype]` — Soroban's storage macros don't support
/// generic types, so contracts define their own storable member/role types
/// and adapt them into `TeamMember` when calling into this engine.
#[derive(Clone)]
pub struct TeamMember<R: Clone> {
    pub address: Address,
    pub role: R,
    pub is_active: bool,
    /// Unix timestamp after which this role assignment no longer applies. `0` = never.
    pub expires_at: u64,
}

impl<R: Clone> TeamMember<R> {
    /// Whether this membership is active and unexpired at `now`.
    pub fn is_valid_at(&self, now: u64) -> bool {
        self.is_active && (self.expires_at == 0 || now <= self.expires_at)
    }
}

/// Maps a role to the permissions it grants.
///
/// Implemented per-contract for its own concrete `Role`/`Permission` enums,
/// replacing the hardcoded `match` that lived in `rbac_access::get_role_permissions`.
pub trait RolePermissions<R, P>
where
    P: Clone + PartialEq + IntoVal<Env, Val> + TryFromVal<Env, Val>,
{
    fn permissions_for(env: &Env, role: &R) -> Vec<P>;
}

/// Outcome of a permission check, generalizing `rbac::PermissionResult`.
pub struct PermissionResult<R> {
    pub allowed: bool,
    pub role: Option<R>,
}

/// Finds a team member by address among `members`.
pub fn find_team_member<R, I>(address: &Address, members: I) -> Option<TeamMember<R>>
where
    R: Clone,
    I: IntoIterator<Item = TeamMember<R>>,
{
    members.into_iter().find(|m| &m.address == address)
}

/// Checks whether `member_address` currently holds `permission`, based on
/// its active team-role assignment and the contract-supplied
/// [`RolePermissions`] mapping `M`.
pub fn check_permission<R, P, M, I>(
    env: &Env,
    member_address: &Address,
    permission: &P,
    members: I,
    now: u64,
) -> PermissionResult<R>
where
    R: Clone,
    P: Clone + PartialEq + IntoVal<Env, Val> + TryFromVal<Env, Val>,
    M: RolePermissions<R, P>,
    I: IntoIterator<Item = TeamMember<R>>,
{
    match find_team_member(member_address, members) {
        Some(member) if member.is_valid_at(now) => {
            let allowed = M::permissions_for(env, &member.role)
                .into_iter()
                .any(|p| &p == permission);
            PermissionResult {
                allowed,
                role: Some(member.role),
            }
        }
        Some(member) => PermissionResult {
            allowed: false,
            role: Some(member.role),
        },
        None => PermissionResult {
            allowed: false,
            role: None,
        },
    }
}

/// Validates that `actor` currently holds `permission`; the `Ok`/`Err` form
/// of [`check_permission`] for direct use with `?` in contract functions.
pub fn validate_permission<R, P, M, I>(
    env: &Env,
    actor: &Address,
    permission: &P,
    members: I,
    now: u64,
) -> Result<(), CommonError>
where
    R: Clone,
    P: Clone + PartialEq + IntoVal<Env, Val> + TryFromVal<Env, Val>,
    M: RolePermissions<R, P>,
    I: IntoIterator<Item = TeamMember<R>>,
{
    if check_permission::<R, P, M, I>(env, actor, permission, members, now).allowed {
        Ok(())
    } else {
        Err(CommonError::Unauthorized)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{contracttype, testutils::Address as _};

    #[derive(Clone, PartialEq, Debug)]
    #[contracttype]
    enum TestRole {
        Owner,
        Viewer,
    }

    #[derive(Clone, PartialEq, Debug)]
    #[contracttype]
    enum TestPermission {
        Withdraw,
        View,
    }

    struct TestRoleMap;
    impl RolePermissions<TestRole, TestPermission> for TestRoleMap {
        fn permissions_for(env: &Env, role: &TestRole) -> Vec<TestPermission> {
            match role {
                TestRole::Owner => {
                    Vec::from_array(env, [TestPermission::Withdraw, TestPermission::View])
                }
                TestRole::Viewer => Vec::from_array(env, [TestPermission::View]),
            }
        }
    }

    #[test]
    fn owner_can_withdraw_viewer_cannot() {
        let env = Env::default();
        let owner = Address::generate(&env);
        let viewer = Address::generate(&env);
        let members = [
            TeamMember {
                address: owner.clone(),
                role: TestRole::Owner,
                is_active: true,
                expires_at: 0,
            },
            TeamMember {
                address: viewer.clone(),
                role: TestRole::Viewer,
                is_active: true,
                expires_at: 0,
            },
        ];

        let owner_result = check_permission::<TestRole, TestPermission, TestRoleMap, _>(
            &env,
            &owner,
            &TestPermission::Withdraw,
            members.clone(),
            0,
        );
        assert!(owner_result.allowed);

        let viewer_result = check_permission::<TestRole, TestPermission, TestRoleMap, _>(
            &env,
            &viewer,
            &TestPermission::Withdraw,
            members.clone(),
            0,
        );
        assert!(!viewer_result.allowed);
    }

    #[test]
    fn expired_membership_is_denied() {
        let env = Env::default();
        let user = Address::generate(&env);
        let members = [TeamMember {
            address: user.clone(),
            role: TestRole::Owner,
            is_active: true,
            expires_at: 5,
        }];

        let result = check_permission::<TestRole, TestPermission, TestRoleMap, _>(
            &env,
            &user,
            &TestPermission::Withdraw,
            members,
            10,
        );
        assert!(!result.allowed);
    }

    #[test]
    fn unknown_address_is_denied() {
        let env = Env::default();
        let user = Address::generate(&env);
        let stranger = Address::generate(&env);
        let members = [TeamMember {
            address: user,
            role: TestRole::Owner,
            is_active: true,
            expires_at: 0,
        }];

        let result = check_permission::<TestRole, TestPermission, TestRoleMap, _>(
            &env,
            &stranger,
            &TestPermission::View,
            members,
            0,
        );
        assert!(!result.allowed);
        assert!(result.role.is_none());
    }

    #[test]
    fn validate_permission_maps_to_common_error() {
        let env = Env::default();
        let stranger = Address::generate(&env);
        let members: [TeamMember<TestRole>; 0] = [];

        let result = validate_permission::<TestRole, TestPermission, TestRoleMap, _>(
            &env,
            &stranger,
            &TestPermission::View,
            members,
            0,
        );
        assert_eq!(result, Err(CommonError::Unauthorized));
    }
}
