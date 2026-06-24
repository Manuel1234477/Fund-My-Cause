/** Wallet signing callback — matches WalletContext.signTx */
export type SignFn = (xdr: string) => Promise<string>;

export type CampaignStatus =
  | "Active"
  | "Successful"
  | "Refunded"
  | "Cancelled"
  | "Paused"
  | "Archived";

export type Category =
  | "Charity"
  | "Technology"
  | "Creative"
  | "Event"
  | "Personal"
  | "Other";

// ── View return types ─────────────────────────────────────────────────────────

export interface CampaignStats {
  /** Total raised in XLM */
  raisedXlm: number;
  /** Goal in XLM */
  goalXlm: number;
  /** Progress 0–100 (can exceed 100 with matching) */
  progressPercent: number;
  contributorCount: number;
  avgContributionXlm: number;
  largestContributionXlm: number;
  // Raw stroops for on-chain operations
  raisedStroops: bigint;
  goalStroops: bigint;
}

export interface CampaignInfo {
  creator: string;
  token: string;
  goalXlm: number;
  goalStroops: bigint;
  deadline: Date;
  minContributionXlm: number;
  minContributionStroops: bigint;
  maxContributionXlm: number;
  maxContributionStroops: bigint;
  title: string;
  description: string;
  status: CampaignStatus;
  category: Category;
  hasPlatformConfig: boolean;
  platformFeeBps: number;
}

export interface PerformanceMetrics {
  successRateBps: number;
  contributionVelocityXlm: number;  // XLM per day
  trending: number;                  // positive = accelerating
  milestonesReached: number;
  totalMilestones: number;
  timeElapsedSeconds: number;
  estimatedSecondsToGoal: number;
  avgDailyContributionXlm: number;
}

export interface ContributionRecord {
  amountXlm: number;
  timestamp: Date;
  runningTotalXlm: number;
}

export interface MatchingConfig {
  sponsor: string;
  matchRatioBps: number;
  maxMatchXlm: number;
  maxMatchStroops: bigint;
}

// ── Options types ─────────────────────────────────────────────────────────────

export interface FmcClientConfig {
  contractId: string;
  rpcUrl: string;
  networkPassphrase: string;
  horizonUrl: string;
}

export interface ContributeOptions {
  contributor: string;
  amountXlm: number;
  tokenId: string;
  message?: string;
  signTx: SignFn;
}

export interface WithdrawOptions {
  creator: string;
  signTx: SignFn;
}

export interface RefundOptions {
  contributor: string;
  signTx: SignFn;
}

export interface SetupMatchingOptions {
  sponsorAddress: string;
  matchRatioBps: number;
  maxMatchXlm: number;
  signTx: SignFn;
}

export interface RefundMatchingSponsorOptions {
  creatorAddress: string;
  signTx: SignFn;
}

export interface CancelOptions {
  creator: string;
  signTx: SignFn;
}

export interface ListContributorsOptions {
  offset: number;
  limit: number;
}

export interface RegistryClientConfig {
  contractId: string;
  rpcUrl: string;
  networkPassphrase: string;
  horizonUrl: string;
}

export interface ListOptions {
  offset: number;
  limit: number;
}

export interface ListByCategoryOptions extends ListOptions {
  categoryId: number;
}
