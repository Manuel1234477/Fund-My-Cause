/// Error types for the achievements contract
use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
pub enum ContractError {
    /// Contract is already initialized
    AlreadyInitialized = 1,
    /// Unauthorized access
    Unauthorized = 2,
    /// Achievement type is invalid
    InvalidAchievementType = 3,
    /// User not found
    UserNotFound = 4,
    /// Achievement already unlocked
    AchievementAlreadyUnlocked = 5,
    /// Invalid amount provided
    InvalidAmount = 6,
    /// Leaderboard type is invalid
    InvalidLeaderboardType = 7,
    /// Challenge not found
    ChallengeNotFound = 8,
    /// Challenge not active
    ChallengeNotActive = 9,
    /// User already joined challenge
    AlreadyJoinedChallenge = 10,
    /// Insufficient points
    InsufficientPoints = 11,
    /// Storage key not found
    KeyNotFound = 12,
    /// Invalid metadata
    InvalidMetadata = 13,
    /// Referral not found
    ReferralNotFound = 14,
    /// Contribution record not found
    ContributionNotFound = 15,
    /// Streak update failed
    StreakUpdateFailed = 16,
}
