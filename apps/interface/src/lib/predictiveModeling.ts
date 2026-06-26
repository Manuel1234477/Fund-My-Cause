import { CampaignData } from "@/types/soroban";

export interface ForecastPoint {
  label: string;
  value: number;
}

export function predictSuccessProbability(campaign: CampaignData): number {
  const progress = campaign.goal > 0 ? campaign.raised / campaign.goal : 0;
  const deadlineMs = new Date(campaign.deadline).getTime();
  const remainingDays = Math.max(1, (deadlineMs - Date.now()) / 86_400_000);
  const momentum = campaign.contributorCount > 0 ? campaign.averageContribution * campaign.contributorCount : 0;

  const baseScore = Math.min(1, progress * 0.75 + Math.min(1, momentum / Math.max(campaign.goal, 1)) * 0.2);
  const timeAdjustment = Math.max(0, Math.min(1, 1 - remainingDays / 90));
  const probability = Math.min(1, Math.max(0, baseScore + timeAdjustment * 0.15));

  return Number((probability * 100).toFixed(0));
}

export function buildTrendForecast(campaigns: CampaignData[]): ForecastPoint[] {
  const sorted = [...campaigns].sort((a, b) => b.raised - a.raised);
  return sorted.slice(0, 5).map((campaign) => ({
    label: campaign.title.substring(0, 20),
    value: predictSuccessProbability(campaign),
  }));
}

export function compareCampaigns(campaigns: CampaignData[]) {
  return campaigns
    .map((campaign) => ({
      contractId: campaign.contractId,
      title: campaign.title,
      raised: campaign.raised,
      goal: campaign.goal,
      status: campaign.status,
      progress: campaign.goal > 0 ? campaign.raised / campaign.goal : 0,
      successProbability: predictSuccessProbability(campaign),
    }))
    .sort((a, b) => b.successProbability - a.successProbability);
}
