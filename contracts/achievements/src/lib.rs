//! # Fund-My-Cause Achievements Contract
//!
//! A Soroban smart contract for managing user achievements, NFT badges, and gamification
//! on the Fund My Cause platform.
//!
//! ## Overview
//!
//! The achievements contract tracks user progress and awards NFT badges for:
//! - Contribution milestones
//! - Social engagement
//! - Referral success
//! - Community support
//! - Campaign goals reached
//!
//! ## Features
//!
//! - **Achievement System** - 12+ unique achievements with tiers (common, uncommon, rare, epic, legendary)
//! - **NFT Badges** - Mint NFTs for achievement milestones
//! - **Points System** - Award points for activities (achievements, contributions, referrals)
//! - **Leaderboards** - Track top contributors, referrers, and achievement collectors
//! - **Contribution Streaks** - Reward consecutive daily contributions
//! - **Level System** - Progress from level 1-100 based on points
//! - **Referral Tracking** - Monitor referral success and rewards
//! - **Challenge Tracking** - Track participation in limited-time challenges
//! - **Audit Trail** - Complete history of achievement unlocks

#![no_std]

mod achievements;
mod errors;
mod events;
mod leaderboard;
mod points;
mod storage;
mod types;
mod validation;

pub use achievements::{unlock_achievement, get_user_achievements};
pub use errors::ContractError;
pub use events::*;
pub use leaderboard::{get_leaderboard, add_leaderboard_entry};
pub use points::{award_points, get_user_level, get_user_points};
pub use storage::*;
pub use types::*;
pub use validation::*;

use soroban_sdk::{contract, contractimpl, Address, String, Vec, Env, map};

/// Main achievement contract
#[contract]
pub struct AchievementsContract;

#[contractimpl]
impl AchievementsContract {
    /// Initialize the achievements contract
    ///
    /// # Arguments
    ///
    /// * `admin` - The administrator address for the contract
    /// * `platform_address` - Platform address for fee collection
    pub fn initialize(env: Env, admin: Address, platform_address: Address) -> Result<(), ContractError> {
        admin.require_auth();

        if env.storage().instance().has(&storage::KEY_ADMIN) {
            return Err(ContractError::AlreadyInitialized);
        }

        env.storage().instance().set(&storage::KEY_ADMIN, &admin);
        env.storage().instance().set(&storage::KEY_PLATFORM, &platform_address);
        
        // Publish initialization event
        env.events()
            .publish(("achievements", "initialized"), (admin.clone(), platform_address));

        Ok(())
    }

    /// Unlock an achievement for a user
    ///
    /// # Arguments
    ///
    /// * `user` - User address
    /// * `achievement_type` - Type of achievement to unlock
    /// * `metadata` - Optional metadata about the achievement
    pub fn unlock_achievement(
        env: Env,
        user: Address,
        achievement_type: u32,
        metadata: String,
    ) -> Result<AchievementNFT, ContractError> {
        user.require_auth();

        // Validate achievement type
        validate_achievement_type(achievement_type)?;

        // Create achievement NFT
        let nft = AchievementNFT {
            user: user.clone(),
            achievement_type,
            unlocked_at: env.ledger().timestamp(),
            metadata,
            nft_id: generate_nft_id(&env, &user, achievement_type),
        };

        // Store achievement
        store_achievement(&env, &user, &nft)?;

        // Award points
        let points = get_achievement_points(achievement_type);
        award_points(&env, &user, points)?;

        // Update level if needed
        let new_level = calculate_level(env.storage().instance().get::<_, u32>(&format!("points:{}", user))?)?;
        
        // Add to leaderboard
        add_leaderboard_entry(
            &env,
            &user,
            points,
            LeaderboardType::Achievements,
        )?;

        // Publish achievement unlocked event
        env.events().publish(
            ("achievements", "unlocked"),
            (&user, achievement_type, new_level),
        );

        Ok(nft)
    }

    /// Get user achievements
    ///
    /// # Arguments
    ///
    /// * `user` - User address
    pub fn get_achievements(env: Env, user: Address) -> Result<Vec<AchievementNFT>, ContractError> {
        get_user_achievements(&env, &user)
    }

    /// Get leaderboard entries
    ///
    /// # Arguments
    ///
    /// * `leaderboard_type` - Type of leaderboard
    /// * `limit` - Maximum number of entries to return
    pub fn get_leaderboard_entries(
        env: Env,
        leaderboard_type: u32,
        limit: u32,
    ) -> Result<Vec<LeaderboardEntry>, ContractError> {
        get_leaderboard(&env, validate_leaderboard_type(leaderboard_type)?, limit as usize)
    }

    /// Get user points
    ///
    /// # Arguments
    ///
    /// * `user` - User address
    pub fn get_points(env: Env, user: Address) -> Result<u32, ContractError> {
        get_user_points(&env, &user)
    }

    /// Get user level
    ///
    /// # Arguments
    ///
    /// * `user` - User address
    pub fn get_level(env: Env, user: Address) -> Result<u32, ContractError> {
        get_user_level(&env, &user)
    }

    /// Award points to a user
    ///
    /// # Arguments
    ///
    /// * `user` - User address
    /// * `points` - Points to award
    pub fn award_user_points(
        env: Env,
        user: Address,
        points: u32,
    ) -> Result<u32, ContractError> {
        // Only contract admins can call this
        let admin: Address = env.storage().instance().get(&storage::KEY_ADMIN)?;
        admin.require_auth();

        award_points(&env, &user, points)?;

        let total_points = get_user_points(&env, &user)?;

        env.events().publish(
            ("achievements", "points_awarded"),
            (&user, points),
        );

        Ok(total_points)
    }

    /// Record a contribution for achievement tracking
    ///
    /// # Arguments
    ///
    /// * `user` - User address
    /// * `campaign_id` - Campaign ID
    /// * `amount` - Contribution amount
    pub fn record_contribution(
        env: Env,
        user: Address,
        campaign_id: String,
        amount: i128,
    ) -> Result<(), ContractError> {
        user.require_auth();

        validate_amount(amount)?;

        // Store contribution record
        store_contribution(&env, &user, &campaign_id, amount)?;

        // Award points
        let points = calculate_contribution_points(amount);
        award_points(&env, &user, points)?;

        // Check for achievement milestones
        check_contribution_achievements(&env, &user)?;

        env.events().publish(
            ("achievements", "contribution_recorded"),
            (&user, campaign_id, amount),
        );

        Ok(())
    }

    /// Record a referral success
    ///
    /// # Arguments
    ///
    /// * `referrer` - Referrer address
    /// * `referee` - Referee address
    pub fn record_referral(
        env: Env,
        referrer: Address,
        referee: Address,
    ) -> Result<(), ContractError> {
        referrer.require_auth();

        // Store referral
        store_referral(&env, &referrer, &referee)?;

        // Award points
        award_points(&env, &referrer, 50)?;

        // Check for referral achievements
        check_referral_achievements(&env, &referrer)?;

        env.events().publish(
            ("achievements", "referral_recorded"),
            (&referrer, &referee),
        );

        Ok(())
    }

    /// Update user contribution streak
    ///
    /// # Arguments
    ///
    /// * `user` - User address
    pub fn update_streak(env: Env, user: Address) -> Result<u32, ContractError> {
        user.require_auth();

        let current_time = env.ledger().timestamp();
        let last_contribution_key = format!("last_contribution:{}", user);
        let streak_key = format!("streak:{}", user);

        let last_contribution: Option<u64> = env.storage().instance().get(&last_contribution_key).ok();
        let current_streak: u32 = env.storage().instance().get(&streak_key).unwrap_or(0);

        let new_streak = if let Some(last_time) = last_contribution {
            let days_since = (current_time - last_time) / 86400;
            if days_since <= 1 {
                current_streak + 1
            } else {
                1
            }
        } else {
            1
        };

        env.storage().instance().set(&last_contribution_key, &current_time);
        env.storage().instance().set(&streak_key, &new_streak);

        // Award streak bonus points
        if new_streak > 0 && new_streak % 7 == 0 {
            award_points(&env, &user, 100)?; // Bonus for 7-day streak
        }

        env.events().publish(
            ("achievements", "streak_updated"),
            (&user, new_streak),
        );

        Ok(new_streak)
    }
}

// ── Helper Functions ────────────────────────────────────────────────────────

/// Generate unique NFT ID
fn generate_nft_id(env: &Env, user: &Address, achievement_type: u32) -> String {
    use soroban_sdk::crypto;
    
    let combined = format!("{}:{}", user, achievement_type);
    let hash = crypto::keccak256(combined.as_bytes());
    
    // Convert hash to hex string
    let mut result = String::new();
    for byte in hash.iter() {
        result.push_str(&format!("{:02x}", byte));
    }
    
    result
}

/// Store achievement
fn store_achievement(
    env: &Env,
    user: &Address,
    nft: &AchievementNFT,
) -> Result<(), ContractError> {
    let key = format!("achievement:{}:{}", user, nft.achievement_type);
    env.storage().instance().set(&key, nft);
    Ok(())
}

/// Get achievement points based on type
fn get_achievement_points(achievement_type: u32) -> u32 {
    match achievement_type {
        1 => 50,   // First Contribution
        2 => 150,  // Super Supporter
        3 => 300,  // Mega Donor
        4 => 200,  // Consistent Contributor
        5 => 100,  // Social Butterfly
        6 => 250,  // Viral Sharer
        7 => 400,  // Referral Champion
        8 => 100,  // Campaign Completionist
        9 => 200,  // Milestone Hunter
        10 => 350, // Community Supporter
        11 => 75,  // Early Bird
        12 => 500, // Goal Crusher
        13 => 600, // Trending Backer
        _ => 50,
    }
}

/// Calculate contribution points
fn calculate_contribution_points(amount: i128) -> u32 {
    // 1 point per stroop (0.0000001 XLM)
    ((amount / 1_000_000) as u32).max(1).min(1000)
}

/// Calculate user level from points
fn calculate_level(points: u32) -> Result<u32, ContractError> {
    // Level progression: 100 points per level (max 100)
    let level = ((points / 100) as u32 + 1).min(100);
    Ok(level)
}

/// Store contribution record
fn store_contribution(
    env: &Env,
    user: &Address,
    campaign_id: &String,
    amount: i128,
) -> Result<(), ContractError> {
    let key = format!("contrib:{}:{}", user, campaign_id);
    env.storage().instance().set(&key, &amount);
    Ok(())
}

/// Store referral record
fn store_referral(
    env: &Env,
    referrer: &Address,
    referee: &Address,
) -> Result<(), ContractError> {
    let key = format!("referral:{}:{}", referrer, referee);
    let timestamp = env.ledger().timestamp();
    env.storage().instance().set(&key, &timestamp);
    Ok(())
}

/// Check for contribution-based achievements
fn check_contribution_achievements(env: &Env, _user: &Address) -> Result<(), ContractError> {
    // TODO: Check and unlock achievements based on contribution history
    Ok(())
}

/// Check for referral-based achievements
fn check_referral_achievements(env: &Env, _referrer: &Address) -> Result<(), ContractError> {
    // TODO: Check and unlock achievements based on referral count
    Ok(())
}
