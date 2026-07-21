import { describe, it, expect, beforeEach } from "vitest";
import { ContractService } from "./contract.js";

describe("ContractService", () => {
  let service: InstanceType<typeof ContractService>;

  beforeEach(() => {
    service = new ContractService("https://soroban-testnet.stellar.org", "testnet");
  });

  describe("getCampaign", () => {
    it("returns a campaign shaped object for the given id", async () => {
      const campaign = await service.getCampaign("camp_42");

      expect(campaign).not.toBeNull();
      expect(campaign?.id).toBe("camp_42");
      expect(typeof campaign?.goal).toBe("bigint");
      expect(typeof campaign?.raised).toBe("bigint");
      expect(campaign?.status).toBe("ACTIVE");
    });
  });

  describe("getCampaigns", () => {
    it("returns exactly `limit` campaigns offset by `offset`", async () => {
      const campaigns = await service.getCampaigns({
        pagination: { limit: 5, offset: 10 },
      });

      expect(campaigns).toHaveLength(5);
      expect(campaigns[0].id).toBe("campaign_10");
      expect(campaigns[4].id).toBe("campaign_14");
    });

    it("returns an empty array for a zero limit", async () => {
      const campaigns = await service.getCampaigns({ pagination: { limit: 0, offset: 0 } });
      expect(campaigns).toEqual([]);
    });
  });

  describe("getCampaignCount", () => {
    it("returns a numeric count", async () => {
      const count = await service.getCampaignCount();
      expect(typeof count).toBe("number");
    });
  });

  describe("getTrendingCampaigns", () => {
    it("returns exactly `limit` trending campaigns", async () => {
      const campaigns = await service.getTrendingCampaigns(3);
      expect(campaigns).toHaveLength(3);
      campaigns.forEach((c) => expect(c.status).toBe("ACTIVE"));
    });
  });

  describe("searchCampaigns", () => {
    it("returns campaigns whose title embeds the search query", async () => {
      const campaigns = await service.searchCampaigns("clean water", 2);
      expect(campaigns).toHaveLength(2);
      campaigns.forEach((c) => expect(c.title).toContain("clean water"));
    });
  });

  describe("getUser", () => {
    it("returns a user profile for the given address", async () => {
      const user = await service.getUser("GADDRESS");
      expect(user?.address).toBe("GADDRESS");
      expect(typeof user?.totalContributed).toBe("bigint");
    });
  });

  describe("getStats", () => {
    it("returns platform statistics with bigint fields", async () => {
      const stats = await service.getStats();
      expect(typeof stats.totalRaised).toBe("bigint");
      expect(typeof stats.totalCampaigns).toBe("number");
    });
  });

  describe("verifySignature", () => {
    it("accepts a signature longer than 20 characters", async () => {
      const result = await service.verifySignature(
        "GADDR",
        "message",
        "a".repeat(21)
      );
      expect(result).toBe(true);
    });

    it("rejects a signature that is too short", async () => {
      const result = await service.verifySignature("GADDR", "message", "short");
      expect(result).toBe(false);
    });
  });

  describe("createCampaign", () => {
    it("creates a campaign owned by the given creator with zero raised", async () => {
      const creator = { address: "GCREATOR" };
      const input = {
        title: "New Campaign",
        description: "desc",
        goal: 1000n,
        deadline: new Date().toISOString(),
        category: "Health",
        minContribution: 10n,
      };

      const campaign = await service.createCampaign(creator, input);

      expect(campaign.creator).toBe("GCREATOR");
      expect(campaign.title).toBe("New Campaign");
      expect(campaign.raised).toBe(0n);
      expect(campaign.status).toBe("ACTIVE");
      expect(campaign.totalContributors).toBe(0);
    });
  });

  describe("updateCampaign", () => {
    it("merges the input into the existing campaign", async () => {
      const updated = await service.updateCampaign(
        "camp_1",
        { address: "GUSER" },
        { title: "Renamed" }
      );

      expect(updated.id).toBe("camp_1");
      expect(updated.title).toBe("Renamed");
    });
  });

  describe("recordContribution", () => {
    it("returns a contribution record matching the input", async () => {
      const input = {
        campaignId: "camp_1",
        contributor: "GCONTRIBUTOR",
        amount: 500n,
        transactionHash: "hash123",
      };

      const contribution = await service.recordContribution(input);

      expect(contribution.campaignId).toBe("camp_1");
      expect(contribution.contributor).toBe("GCONTRIBUTOR");
      expect(contribution.amount).toBe(500n);
      expect(contribution.transactionHash).toBe("hash123");
    });
  });
});
