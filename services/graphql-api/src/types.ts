import type { RedisClientType } from "redis";
import type DataLoader from "dataloader";
import type { PubSubService } from "./services/pubsub.js";

// Contract types
export interface Campaign {
  id: string;
  contractId: string;
  title: string;
  description: string;
  creator: string;
  goal: bigint;
  raised: bigint;
  deadline: string;
  status: CampaignStatus;
  category: string;
  image?: string;
  videoUrl?: string;
  minContribution: bigint;
  totalContributors: number;
  token: string;
  platformFeeBps?: number;
  hasRBACEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Contribution {
  id: string;
  campaignId: string;
  contributor: string;
  amount: bigint;
  timestamp: string;
  transactionHash: string;
}

export interface User {
  address: string;
  totalContributed: bigint;
  contributionCount: number;
  campaigns: Campaign[];
  contributions: Contribution[];
  joinedAt: string;
}

export interface CampaignUpdate {
  id: string;
  campaignId: string;
  content: string;
  ipfsHash: string;
  timestamp: string;
}

export interface Milestone {
  id: string;
  campaignId: string;
  title: string;
  description: string;
  targetAmount: bigint;
  releasePercentage: number;
  status: MilestoneStatus;
}

export interface Contributor {
  address: string;
  amount: bigint;
  contributionCount: number;
  isTopContributor: boolean;
}

export interface CampaignProgress {
  campaignId: string;
  raised: bigint;
  percentageFunded: number;
  contributors: number;
  daysRemaining: number;
  timestamp: string;
}

export interface Statistics {
  totalCampaigns: number;
  activeCampaigns: number;
  totalRaised: bigint;
  totalContributors: number;
  averageContribution: bigint;
  successRate: number;
}

export enum CampaignStatus {
  ACTIVE = "ACTIVE",
  SUCCESSFUL = "SUCCESSFUL",
  REFUNDED = "REFUNDED",
  CANCELLED = "CANCELLED",
  PAUSED = "PAUSED",
  ARCHIVED = "ARCHIVED",
}

export enum MilestoneStatus {
  PENDING = "PENDING",
  REACHED = "REACHED",
  RELEASED = "RELEASED",
}

// DataLoader types
export interface DataLoaders {
  campaigns: DataLoader<string, Campaign | null>;
  contributions: DataLoader<string, Contribution | null>;
  users: DataLoader<string, User | null>;
  campaignContributors: DataLoader<string, Contributor[]>;
  campaignContributions: DataLoader<string, Contribution[]>;
  campaignUpdates: DataLoader<string, CampaignUpdate[]>;
  campaignMilestones: DataLoader<string, Milestone[]>;
  campaignsByStatus: DataLoader<
    { status: CampaignStatus; limit: number },
    Campaign[]
  >;
  userCampaigns: DataLoader<string, Campaign[]>;
  userContributions: DataLoader<string, Contribution[]>;
}

// Context type
export interface Context {
  cache: any; // Redis cache service
  contractService: any; // Contract service
  dataLoader: DataLoaders;
  pubsub: PubSubService;
  authService: any; // Auth service
  user?: {
    address: string;
    isAuthenticated: boolean;
  };
  redis: RedisClientType;
}

// API Response types
export interface CampaignFilter {
  status?: CampaignStatus[];
  category?: string[];
  minGoal?: bigint;
  maxGoal?: bigint;
  creator?: string;
  search?: string;
}

export interface PaginationInput {
  limit: number;
  offset: number;
}

export interface CampaignSort {
  field: SortField;
  direction: SortDirection;
}

export enum SortField {
  CREATED_AT = "CREATED_AT",
  RAISED_AMOUNT = "RAISED_AMOUNT",
  GOAL = "GOAL",
  DEADLINE = "DEADLINE",
  CONTRIBUTORS = "CONTRIBUTORS",
}

export enum SortDirection {
  ASC = "ASC",
  DESC = "DESC",
}

export interface GetCampaignsParams {
  filter?: CampaignFilter;
  pagination: PaginationInput;
  sort?: CampaignSort;
}

export interface CreateCampaignInput {
  title: string;
  description: string;
  goal: bigint;
  deadline: string;
  category: string;
  image?: string;
  videoUrl?: string;
  minContribution: bigint;
}

export interface UpdateCampaignInput {
  title?: string;
  description?: string;
  image?: string;
  videoUrl?: string;
}

export interface RecordContributionInput {
  campaignId: string;
  contributor: string;
  amount: bigint;
  transactionHash: string;
}
