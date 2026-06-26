/// Achievement management functions
use soroban_sdk::{Env, Address, Vec};
use crate::errors::ContractError;
use crate::types::AchievementNFT;
use crate::storage;

/// Get user achievements
pub fn get_user_achievements(env: &Env, user: &Address) -> Result<Vec<AchievementNFT>, ContractError> {
    let mut achievements = Vec::new();

    // Check all possible achievement types (1-13)
    for achievement_type in 1..=13 {
        let key = format!("achievement:{}:{}", user, achievement_type);
        if let Ok(nft) = env.storage().instance().get::<_, AchievementNFT>(&key) {
            achievements.push_back(nft);
        }
    }

    Ok(achievements)
}

/// Check if user has specific achievement
pub fn has_achievement(
    env: &Env,
    user: &Address,
    achievement_type: u32,
) -> Result<bool, ContractError> {
    let key = format!("achievement:{}:{}", user, achievement_type);
    Ok(env.storage().instance().get::<_, AchievementNFT>(&key).is_ok())
}

/// Get achievement unlock timestamp
pub fn get_achievement_unlock_time(
    env: &Env,
    user: &Address,
    achievement_type: u32,
) -> Result<u64, ContractError> {
    let key = format!("achievement:{}:{}", user, achievement_type);
    let nft: AchievementNFT = env.storage().instance().get(&key)
        .map_err(|_| ContractError::AchievementNotFound)?;
    Ok(nft.unlocked_at)
}

/// Get all users with specific achievement
pub fn get_achievement_holders(
    env: &Env,
    achievement_type: u32,
) -> Result<Vec<Address>, ContractError> {
    // This would need to be tracked separately in a list
    // For now, return empty vector
    Ok(Vec::new())
}

/// Count user achievements
pub fn count_achievements(env: &Env, user: &Address) -> Result<u32, ContractError> {
    let achievements = get_user_achievements(env, user)?;
    Ok(achievements.len() as u32)
}

// Re-export for cases where this variant doesn't exist
// This is a placeholder for missing variant in the error enum
const ACHIEVEMENT_NOT_FOUND: i32 = 15;
