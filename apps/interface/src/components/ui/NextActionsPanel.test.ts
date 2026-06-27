import { describe, it, expect } from "vitest";
import { computeNextActions } from "./NextActionsPanel";
import type { Campaign } from "@/types/campaign";

const mockCampaign = (overrides?: Partial<Campaign>): Campaign => ({
  id: "test-1",
  contractId: "C123",
  title: "Test Campaign",
  description: "A test campaign",
  creator: "GXXX",
  raised: 0,
  goal: 1000,
  deadline: new Date(Date.now() + 86400000).toISOString(),
  status: "Active" as const,
  token: "XLM",
  ...overrides,
});

describe("NextActionsPanel", () => {
  describe("computeNextActions", () => {
    it("should return empty array for no campaigns", () => {
      const actions = computeNextActions([]);
      expect(actions).toEqual([]);
    });

    it("should suggest withdrawal when goal is met", () => {
      const campaign = mockCampaign({
        raised: 1500,
        goal: 1000,
      });
      const actions = computeNextActions([campaign]);

      const withdrawAction = actions.find((a) => a.id.includes("withdraw"));
      expect(withdrawAction).toBeDefined();
      expect(withdrawAction?.priority).toBe("high");
    });

    it("should suggest deadline extension when approaching deadline", () => {
      const campaign = mockCampaign({
        raised: 500,
        goal: 1000,
        deadline: new Date(Date.now() + 43200000).toISOString(), // 12 hours
      });
      const actions = computeNextActions([campaign]);

      const deadlineAction = actions.find((a) => a.id.includes("deadline"));
      expect(deadlineAction).toBeDefined();
      expect(deadlineAction?.priority).toBe("high");
    });

    it("should suggest engagement for active campaigns with contributors", () => {
      const campaign = mockCampaign({
        raised: 500,
        goal: 1000,
        contributorCount: 5,
      });
      const actions = computeNextActions([campaign]);

      const engagementAction = actions.find((a) => a.id.includes("engagement"));
      expect(engagementAction).toBeDefined();
      expect(engagementAction?.priority).toBe("medium");
    });

    it("should suggest boosting when far from goal with time left", () => {
      const campaign = mockCampaign({
        raised: 100,
        goal: 1000,
        deadline: new Date(Date.now() + 259200000).toISOString(), // 3 days
      });
      const actions = computeNextActions([campaign]);

      const boostAction = actions.find((a) => a.id.includes("boost"));
      expect(boostAction).toBeDefined();
      expect(boostAction?.priority).toBe("medium");
    });

    it("should show refund status for refunded campaigns", () => {
      const campaign = mockCampaign({
        raised: 0,
        status: "Refunded" as const,
      });
      const actions = computeNextActions([campaign]);

      const refundAction = actions.find((a) => a.id.includes("refunded"));
      expect(refundAction).toBeDefined();
      expect(refundAction?.priority).toBe("low");
    });

    it("should prioritize high priority actions first", () => {
      const campaigns = [
        mockCampaign({
          id: "test-1",
          raised: 1500,
          goal: 1000,
        }),
        mockCampaign({
          id: "test-2",
          raised: 100,
          status: "Refunded" as const,
        }),
      ];
      const actions = computeNextActions(campaigns);

      // Should have high priority action first
      expect(actions[0].priority).toBe("high");
      if (actions.length > 1) {
        expect(actions[1].priority).toBe("low");
      }
    });

    it("should have action buttons with onClick handlers", () => {
      const campaign = mockCampaign({
        raised: 1500,
        goal: 1000,
      });
      const actions = computeNextActions([campaign]);

      const withdrawAction = actions.find((a) => a.id.includes("withdraw"));
      expect(withdrawAction?.action).toBeDefined();
      expect(withdrawAction?.action?.label).toBe("Withdraw Now");
    });
  });
});
