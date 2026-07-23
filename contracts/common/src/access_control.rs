//! Address-based access-control primitives shared across contracts.
//!
//! These generalize the "is the caller the one address allowed to do this"
//! checks duplicated across `crowdfund` (`creator.require_auth()` /
//! `admin.require_auth()` throughout `lib.rs`) and `achievements` (ad hoc
//! `admin.require_auth()` calls). They intentionally encode no
//! contract-specific role or permission set — see [`crate::rbac`] for the
//! generic, role-set-agnostic team-RBAC engine.

use soroban_sdk::{Address, Vec};

use crate::error::CommonError;

/// Address-comparison and `require_auth` access-control helpers.
pub struct AccessControl;

impl AccessControl {
    /// Requires that `caller` is exactly `expected`.
    ///
    /// Use this when `caller` has already been authenticated (e.g. via
    /// [`AccessControl::require_role_auth`] or another `require_auth()`
    /// call) and just needs to be compared against a stored/expected
    /// address.
    pub fn require_role(caller: &Address, expected: &Address) -> Result<(), CommonError> {
        if caller == expected {
            Ok(())
        } else {
            Err(CommonError::Unauthorized)
        }
    }

    /// Requires that `role_address` authorized the current invocation.
    ///
    /// Thin wrapper around [`Address::require_auth`] so contracts express
    /// the "only this stored address may call this" pattern the same way
    /// everywhere, rather than re-deriving it inline per contract.
    pub fn require_role_auth(role_address: &Address) {
        role_address.require_auth();
    }

    /// Returns whether `addr` is present in `members`.
    pub fn is_member(addr: &Address, members: &Vec<Address>) -> bool {
        members.contains(addr)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env};

    #[test]
    fn require_role_accepts_matching_address() {
        let env = Env::default();
        let addr = Address::generate(&env);
        assert_eq!(AccessControl::require_role(&addr, &addr), Ok(()));
    }

    #[test]
    fn require_role_rejects_mismatched_address() {
        let env = Env::default();
        let a = Address::generate(&env);
        let b = Address::generate(&env);
        assert_eq!(
            AccessControl::require_role(&a, &b),
            Err(CommonError::Unauthorized)
        );
    }

    #[test]
    fn is_member_checks_membership() {
        let env = Env::default();
        let a = Address::generate(&env);
        let b = Address::generate(&env);
        let members = Vec::from_array(&env, [a.clone()]);

        assert!(AccessControl::is_member(&a, &members));
        assert!(!AccessControl::is_member(&b, &members));
    }
}
