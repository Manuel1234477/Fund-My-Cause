#![cfg(test)]

//! Adversarial scenario testing: reentrancy, race conditions, MEV, manipulation

use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token, Address, Env,
};

mod common;
use common::setup;

#[test]
fn test_adversarial_multiple_refunds_same_tx() {
    let env = Env::default();
    env.mock_all_auths();

    let deadline = 1_000u64;
    let goal = 1_000_000i128;
    let c = setup(&env, goal, deadline, None);

    let attacker = Address::generate(&env);
    c.token_admin.mint(&attacker, &10_000);

    env.ledger().set_timestamp(500);
    c.client.contribute(&attacker, &10_000, &c.token_id, &None);

    env.ledger().set_timestamp(deadline + 1);

    let balance_before = c.token.balance(&attacker);

    // Attempt multiple refunds in sequence
    c.client.refund_single(&attacker);
    c.client.refund_single(&attacker);
    c.client.refund_single(&attacker);

    let balance_after = c.token.balance(&attacker);

    // Should only receive refund once
    assert_eq!(balance_after, balance_before + 10_000);
}

#[test]
fn test_adversarial_race_withdraw_vs_refund() {
    let env = Env::default();
    env.mock_all_auths();

    let deadline = 1_000u64;
    let goal = 5_000i128;
    let c = setup(&env, goal, deadline, None);

    let contributor = Address::generate(&env);
    c.token_admin.mint(&contributor, &goal);

    env.ledger().set_timestamp(500);
    c.client.contribute(&contributor, &goal, &c.token_id, &None);

    env.ledger().set_timestamp(deadline + 1);

    // Successful campaign - creator withdraws
    c.client.withdraw();

    // Contributor attempts refund after successful withdrawal
    let result = c.client.try_refund_single(&contributor);
    assert!(result.is_err()); // Should fail
}

#[test]
fn test_adversarial_front_running_deadline() {
    let env = Env::default();
    env.mock_all_auths();

    let deadline = 1_000u64;
    let goal = 10_000i128;
    let c = setup(&env, goal, deadline, None);

    let c1 = Address::generate(&env);
    let c2 = Address::generate(&env);

    c.token_admin.mint(&c1, &5_000);
    c.token_admin.mint(&c2, &5_000);

    env.ledger().set_timestamp(deadline - 1);

    // Contribution just before deadline
    c.client.contribute(&c1, &5_000, &c.token_id, &None);

    // Set timestamp to deadline
    env.ledger().set_timestamp(deadline);

    // Second contribution at deadline should fail (>= deadline)
    let result = c.client.try_contribute(&c2, &5_000, &c.token_id, &None);
    assert!(result.is_err());
}

#[test]
fn test_adversarial_contribute_after_goal_reached() {
    let env = Env::default();
    env.mock_all_auths();

    let deadline = 1_000u64;
    let goal = 10_000i128;
    let c = setup(&env, goal, deadline, None);

    let c1 = Address::generate(&env);
    let c2 = Address::generate(&env);

    c.token_admin.mint(&c1, &10_000);
    c.token_admin.mint(&c2, &5_000);

    env.ledger().set_timestamp(500);

    // First contribution meets goal
    c.client.contribute(&c1, &10_000, &c.token_id, &None);

    // Additional contribution should still succeed (goal can be exceeded)
    c.client.contribute(&c2, &5_000, &c.token_id, &None);

    assert_eq!(c.client.total_raised(), 15_000);
}

#[test]
fn test_adversarial_platform_fee_manipulation() {
    let env = Env::default();
    env.mock_all_auths();

    let creator = Address::generate(&env);
    let platform = Address::generate(&env);
    let token_admin_addr = Address::generate(&env);
    let token_id = env.register_stellar_asset_contract(token_admin_addr);
    let contract_id = env.register_contract(None, crowdfund::CrowdfundContract);

    let client = crowdfund::CrowdfundContractClient::new(&env, &contract_id);
    let token_admin = token::StellarAssetClient::new(&env, &token_id);
    let token = token::Client::new(&env, &token_id);

    let goal = 10_000i128;
    let deadline = 1_000u64;
    let fee_bps = 10_000u32; // 100% fee (extreme case)

    env.ledger().set_timestamp(100);

    client.initialize(
        &creator,
        &token_id,
        &goal,
        &deadline,
        &1,
        &0i128,
        &soroban_sdk::String::from_str(&env, "Test"),
        &soroban_sdk::String::from_str(&env, "Test"),
        &None,
        &Some(crowdfund::PlatformConfig { address: platform.clone(), fee_bps }),
        &None,
        &crowdfund::Category::Other,
        &None,
        &None,
    );

    let contributor = Address::generate(&env);
    token_admin.mint(&contributor, &goal);

    env.ledger().set_timestamp(500);
    client.contribute(&contributor, &goal, &token_id, &None);

    env.ledger().set_timestamp(deadline + 1);
    client.withdraw();

    // Fee cannot exceed total or create negative payout
    assert!(token.balance(&platform) <= goal);
}

#[test]
fn test_adversarial_reject_wrong_token() {
    let env = Env::default();
    env.mock_all_auths();

    let deadline = 1_000u64;
    let goal = 10_000i128;
    let c = setup(&env, goal, deadline, None);

    let wrong_admin = Address::generate(&env);
    let wrong_token_id = env.register_stellar_asset_contract(wrong_admin);

    let contributor = Address::generate(&env);
    c.token_admin.mint(&contributor, &10_000);

    env.ledger().set_timestamp(500);

    // Attempt contribution with wrong token
    let result = c.client.try_contribute(&contributor, &10_000, &wrong_token_id, &None);
    assert!(result.is_err());
}

#[test]
fn test_adversarial_state_consistency_under_stress() {
    let env = Env::default();
    env.mock_all_auths();

    let deadline = 1_000u64;
    let goal = 1_000_000i128;
    let c = setup(&env, goal, deadline, None);

    env.ledger().set_timestamp(500);

    // Rapid sequence of contributions and state checks
    for i in 0..10 {
        let contributor = Address::generate(&env);
        let amount = 1_000i128;
        c.token_admin.mint(&contributor, &amount);

        c.client.contribute(&contributor, &amount, &c.token_id, &None);

        let expected_total = (i + 1) as i128 * 1_000;
        assert_eq!(c.client.total_raised(), expected_total);
        assert_eq!(c.client.contribution(&contributor), amount);
    }
}

#[test]
fn test_adversarial_selective_refund_targeting() {
    let env = Env::default();
    env.mock_all_auths();

    let deadline = 1_000u64;
    let goal = 100_000i128;
    let c = setup(&env, goal, deadline, None);

    let contributors: Vec<Address> = (0..5).map(|_| Address::generate(&env)).collect();
    let amounts = vec![1_000i128, 2_000, 3_000, 4_000, 5_000];

    env.ledger().set_timestamp(500);
    for (addr, &amt) in contributors.iter().zip(amounts.iter()) {
        c.token_admin.mint(addr, &amt);
        c.client.contribute(addr, &amt, &c.token_id, &None);
    }

    env.ledger().set_timestamp(deadline + 1);

    // Refund in arbitrary order
    for &addr in &contributors {
        c.client.refund_single(&addr);
    }

    // All refunds succeeded
    for (addr, &amt) in contributors.iter().zip(amounts.iter()) {
        assert_eq!(c.token.balance(addr), amt);
    }
}

#[test]
fn test_adversarial_zero_goal() {
    // Contract should reject zero goal during initialization
    let env = Env::default();
    env.mock_all_auths();

    let creator = Address::generate(&env);
    let token_admin_addr = Address::generate(&env);
    let token_id = env.register_stellar_asset_contract(token_admin_addr);
    let contract_id = env.register_contract(None, crowdfund::CrowdfundContract);

    let client = crowdfund::CrowdfundContractClient::new(&env, &contract_id);

    env.ledger().set_timestamp(100);

    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        client.initialize(
            &creator,
            &token_id,
            &0i128,
            &1_000u64,
            &1,
            &0i128,
            &soroban_sdk::String::from_str(&env, "Test"),
            &soroban_sdk::String::from_str(&env, "Test"),
            &None,
            &None,
            &None,
            &crowdfund::Category::Other,
            &None,
            &None,
        );
    }));

    // Should handle gracefully (panic or error)
    assert!(result.is_err());
}

#[test]
fn test_adversarial_past_deadline_initialization() {
    let env = Env::default();
    env.mock_all_auths();

    let creator = Address::generate(&env);
    let token_admin_addr = Address::generate(&env);
    let token_id = env.register_stellar_asset_contract(token_admin_addr);
    let contract_id = env.register_contract(None, crowdfund::CrowdfundContract);

    let client = crowdfund::CrowdfundContractClient::new(&env, &contract_id);

    env.ledger().set_timestamp(1_000);

    // Initialize with deadline in the past
    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        client.initialize(
            &creator,
            &token_id,
            &10_000i128,
            &500u64, // Past deadline
            &1,
            &0i128,
            &soroban_sdk::String::from_str(&env, "Test"),
            &soroban_sdk::String::from_str(&env, "Test"),
            &None,
            &None,
            &None,
            &crowdfund::Category::Other,
            &None,
            &None,
        );
    }));

    assert!(result.is_err());
}
