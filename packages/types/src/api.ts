export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface CampaignListResponse {
  campaigns: CampaignResponse[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CampaignResponse {
  id: string;
  contractId: string;
  title: string;
  description: string;
  creator: string;
  image?: string;
  raised: number;
  goal: number;
  deadline: string;
  status: "Active" | "Successful" | "Refunded" | "Cancelled" | "Paused";
  token: string;
  minContribution: number;
  contributorCount: number;
  averageContribution: number;
  largestContribution: number;
  socialLinks?: string[];
  platformFeeBps?: number;
  platformAddress?: string;
  videoUrl?: string;
  category?: string;
  faqs?: FAQResponse[];
  teamMembers?: TeamMemberResponse[];
  milestones?: MilestoneResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface FAQResponse {
  id: string;
  question: string;
  answer: string;
}

export interface TeamMemberResponse {
  id: string;
  name: string;
  role: string;
  bio?: string;
  avatarUrl?: string;
  profileUrl?: string;
}

export interface MilestoneResponse {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  status: "pending" | "achieved" | "failed";
  dueDate?: string;
}

export interface ContributionResponse {
  id: string;
  campaignId: string;
  contributor: string;
  amount: number;
  token: string;
  timestamp: string;
  transactionHash: string;
  status: "pending" | "confirmed" | "failed";
}

export interface UserProfileResponse {
  address: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  createdCampaigns: number;
  totalContributed: number;
  joinedAt: string;
  isVerified: boolean;
}

export interface TransactionResponse {
  id: string;
  hash: string;
  type: "contribute" | "withdraw" | "refund" | "initialize";
  campaignId: string;
  amount?: number;
  status: "pending" | "confirmed" | "failed";
  timestamp: string;
  error?: string;
}

export interface WalletBalanceResponse {
  address: string;
  xlmBalance: number;
  tokenBalances: Record<string, number>;
  lastUpdated: string;
}

export interface SearchResponse {
  campaigns: CampaignResponse[];
  users: UserProfileResponse[];
  total: number;
}

export interface StatisticsResponse {
  totalCampaigns: number;
  activeCampaigns: number;
  totalRaised: number;
  totalContributors: number;
  averageFundingPercentage: number;
  successRate: number;
}

export interface NotificationResponse {
  id: string;
  type: "campaign_update" | "contribution_received" | "goal_reached" | "campaign_ended";
  title: string;
  message: string;
  campaignId?: string;
  read: boolean;
  createdAt: string;
}

export interface CommentResponse {
  id: string;
  campaignId: string;
  author: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  replies?: CommentResponse[];
}

export interface ActivityFeedResponse {
  id: string;
  type: "contribution" | "campaign_created" | "milestone_reached" | "campaign_ended";
  actor: string;
  campaignId: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}
