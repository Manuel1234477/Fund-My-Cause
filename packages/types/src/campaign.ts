import type { CampaignStatus } from "./soroban";
import type { Milestone } from "./milestone";

export interface Campaign {
  id: string;
  contractId: string;
  title: string;
  description: string;
  creator: string;
  image?: string;
  raised: number;
  goal: number;
  deadline: string;
  status: CampaignStatus;
  token: string;
  minContribution?: number;
  acceptedTokens?: string[];
  contributorCount?: number;
  averageContribution?: number;
  largestContribution?: number;
  socialLinks?: string[];
  hasPlatformConfig?: boolean;
  platformFeeBps?: number;
  platformAddress?: string;
  milestones?: Milestone[];
  videoUrl?: string;
  category?: string;
  faqs?: FAQ[];
  teamMembers?: TeamMember[];
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio?: string;
  avatarUrl?: string;
  profileUrl?: string;
}

export interface TrustSignalData {
  isVerified: boolean;
  campaignCount: number;
  accountAgeDays: number;
  backerCount: number;
  isAudited: boolean;
  auditUrl?: string;
}
