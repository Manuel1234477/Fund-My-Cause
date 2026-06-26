import DataLoader from "dataloader";
import type { ContractService } from "./contract.js";
import type { Campaign, Contribution, User, Contributor, CampaignUpdate, Milestone, CampaignStatus, DataLoaders } from "../types.js";

/**
 * Create DataLoader instances for batch loading
 */
export function createDataLoaders(contractService: ContractService): DataLoaders {
  return {
    // Load single campaign by ID
    campaigns: new DataLoader<string, Campaign | null>(async (ids) => {
      return Promise.all(ids.map((id) => contractService.getCampaign(id)));
    }),

    // Load single contribution by ID
    contributions: new DataLoader<string, Contribution | null>(async (ids) => {
      return ids.map((id) => ({
        id,
        campaignId: `campaign_${id}`,
        contributor: `contributor_${id}`,
        amount: BigInt("1000000"),
        timestamp: new Date().toISOString(),
        transactionHash: `hash_${id}`,
      } as Contribution));
    }),

    // Load single user by address
    users: new DataLoader<string, User | null>(async (addresses) => {
      return Promise.all(addresses.map((addr) => contractService.getUser(addr)));
    }),

    // Load all contributors for a campaign
    campaignContributors: new DataLoader<string, Contributor[]>(async (campaignIds) => {
      return campaignIds.map((campaignId) => {
        const contributors: Contributor[] = [];
        for (let i = 0; i < 10; i++) {
          contributors.push({
            address: `contributor_${campaignId}_${i}`,
            amount: BigInt(1000000000 * (i + 1)),
            contributionCount: Math.floor(Math.random() * 5) + 1,
            isTopContributor: i < 5,
          });
        }
        return contributors;
      });
    }),

    // Load all contributions for a campaign
    campaignContributions: new DataLoader<string, Contribution[]>(async (campaignIds) => {
      return campaignIds.map((campaignId) => {
        const contributions: Contribution[] = [];
        for (let i = 0; i < 20; i++) {
          contributions.push({
            id: `contrib_${campaignId}_${i}`,
            campaignId,
            contributor: `contributor_${campaignId}_${i}`,
            amount: BigInt(Math.floor(Math.random() * 5000000000)),
            timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            transactionHash: `hash_${i}`,
          });
        }
        return contributions;
      });
    }),

    // Load campaign updates
    campaignUpdates: new DataLoader<string, CampaignUpdate[]>(async (campaignIds) => {
      return campaignIds.map((campaignId) => {
        const updates: CampaignUpdate[] = [];
        for (let i = 0; i < 5; i++) {
          updates.push({
            id: `update_${campaignId}_${i}`,
            campaignId,
            content: `Update ${i + 1}: Campaign progress update`,
            ipfsHash: `QmXxxx${campaignId}${i}`,
            timestamp: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString(),
          });
        }
        return updates;
      });
    }),

    // Load campaign milestones
    campaignMilestones: new DataLoader<string, Milestone[]>(async (campaignIds) => {
      return campaignIds.map((campaignId) => {
        const milestones: Milestone[] = [
          {
            id: `milestone_${campaignId}_1`,
            campaignId,
            title: "Initial Target",
            description: "Reach 25% of goal",
            targetAmount: BigInt("2500000000"),
            releasePercentage: 25,
            status: "REACHED",
          },
          {
            id: `milestone_${campaignId}_2`,
            campaignId,
            title: "Halfway There",
            description: "Reach 50% of goal",
            targetAmount: BigInt("5000000000"),
            releasePercentage: 50,
            status: "REACHED",
          },
          {
            id: `milestone_${campaignId}_3`,
            campaignId,
            title: "Final Push",
            description: "Reach 100% of goal",
            targetAmount: BigInt("10000000000"),
            releasePercentage: 100,
            status: "PENDING",
          },
        ];
        return milestones;
      });
    }),

    // Load campaigns by status
    campaignsByStatus: new DataLoader<
      { status: CampaignStatus; limit: number },
      Campaign[]
    >(async (keys) => {
      return Promise.all(
        keys.map(async ({ status, limit }) => {
          // Mock implementation
          const campaigns: Campaign[] = [];
          for (let i = 0; i < limit; i++) {
            campaigns.push({
              id: `campaign_${status}_${i}`,
              contractId: `contract_${status}_${i}`,
              title: `${status} Campaign ${i}`,
              description: `Campaign with status ${status}`,
              creator: `creator_${i}`,
              goal: BigInt("10000000000"),
              raised: BigInt(Math.floor(Math.random() * 10000000000)),
              deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              status: status,
              category: "Technology",
              minContribution: BigInt("1000000"),
              totalContributors: Math.floor(Math.random() * 100),
              token: "native",
              platformFeeBps: 250,
              hasRBACEnabled: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
          return campaigns;
        })
      );
    }),

    // Load campaigns created by user
    userCampaigns: new DataLoader<string, Campaign[]>(async (addresses) => {
      return addresses.map((address) => {
        const campaigns: Campaign[] = [];
        for (let i = 0; i < 3; i++) {
          campaigns.push({
            id: `user_campaign_${address}_${i}`,
            contractId: `contract_user_${i}`,
            title: `Campaign by ${address.substring(0, 8)}... ${i}`,
            description: `A campaign created by user`,
            creator: address,
            goal: BigInt("10000000000"),
            raised: BigInt(Math.floor(Math.random() * 5000000000)),
            deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
            status: "ACTIVE" as any,
            category: "Technology",
            minContribution: BigInt("1000000"),
            totalContributors: Math.floor(Math.random() * 50),
            token: "native",
            platformFeeBps: 250,
            hasRBACEnabled: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
        return campaigns;
      });
    }),

    // Load contributions by user
    userContributions: new DataLoader<string, Contribution[]>(async (addresses) => {
      return addresses.map((address) => {
        const contributions: Contribution[] = [];
        for (let i = 0; i < 10; i++) {
          contributions.push({
            id: `user_contrib_${address}_${i}`,
            campaignId: `campaign_${i}`,
            contributor: address,
            amount: BigInt(Math.floor(Math.random() * 1000000000)),
            timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
            transactionHash: `hash_${i}`,
          });
        }
        return contributions;
      });
    }),
  };
}
