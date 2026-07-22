"use client";

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { CampaignDetailContent } from "./CampaignDetailContent";

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock("@/hooks/useCampaign", () => ({
  useCampaign: jest.fn(),
}));

jest.mock("@/hooks/useWallet", () => ({
  useWallet: () => ({ address: null }),
}));

jest.mock("@/components/layout/Navbar", () => ({
  Navbar: () => <div data-testid="navbar" />,
}));

jest.mock("@/components/ui/ProgressBar", () => ({
  ProgressBar: ({ progress }: { progress: number }) => (
    <div data-testid="progress-bar" data-progress={progress} />
  ),
}));

jest.mock("@/components/ui/CountdownTimer", () => ({
  CountdownTimer: ({ deadline }: { deadline: string }) => (
    <div data-testid="countdown">{deadline}</div>
  ),
}));

jest.mock("@/components/ui/ShareButton", () => ({
  ShareButton: () => <div data-testid="share-button" />,
}));

jest.mock("@/components/ui/ContributionLeaderboard", () => ({
  ContributionLeaderboard: () => <div data-testid="leaderboard" />,
}));

jest.mock("@/components/ui/EmbedCodeGenerator", () => ({
  EmbedCodeGenerator: () => <div data-testid="embed-generator" />,
}));

jest.mock("@/components/ui/SimilarCampaigns", () => ({
  SimilarCampaigns: () => <div data-testid="similar-campaigns" />,
}));

jest.mock("@/components/ui/VideoPlayer", () => ({
  VideoPlayer: () => <div data-testid="video-player" />,
}));

jest.mock("@/components/ui/FAQAccordion", () => ({
  FAQAccordion: () => <div data-testid="faq-accordion" />,
}));

jest.mock("@/components/ui/TeamMemberCard", () => ({
  TeamMemberCard: () => <div data-testid="team-member-card" />,
}));

jest.mock("@/components/ui/TrustSignals", () => ({
  TrustSignals: () => <div data-testid="trust-signals" />,
}));

jest.mock("@/components/ui/ActivityFeed", () => ({
  ActivityFeed: () => <div data-testid="activity-feed" />,
}));

jest.mock("@/components/ui/Confetti", () => ({
  Confetti: () => <div data-testid="confetti" />,
}));

jest.mock("@/components/ui/GoalSuccessModal", () => ({
  GoalSuccessModal: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="goal-success-modal">
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

jest.mock("@/components/ui/GoalSuccessBadge", () => ({
  GoalSuccessBadge: () => <div data-testid="goal-success-badge" />,
}));

jest.mock("@/components/ui/ShareModal", () => ({
  ShareModal: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="share-modal">
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

jest.mock("@/components/ui/PausedBanner", () => ({
  PausedBanner: () => <div data-testid="paused-banner" />,
}));

jest.mock("./CampaignActions", () => ({
  CampaignActions: () => <div data-testid="campaign-actions" />,
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

jest.mock("@/lib/campaigns", () => ({
  ALL_CAMPAIGNS: [],
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

const { useCampaign } = jest.requireMock("@/hooks/useCampaign");

const mockInfo = {
  title: "Test Campaign",
  description: "A great cause",
  creator: "GABC1234CREATOR",
  deadline: BigInt(Math.floor(Date.now() / 1000) + 86400), // 1 day from now
  status: "Active" as const,
  socialLinks: [],
};

const mockStats = {
  totalRaised: 5_000_000_000n, // 500 XLM
  goal: 10_000_000_000n, // 1000 XLM
  contributorCount: 42,
  averageContribution: 119_047_619n,
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("CampaignDetailContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows loading spinner while fetching", () => {
    useCampaign.mockReturnValue({
      info: null,
      stats: null,
      loading: true,
      error: null,
      refresh: jest.fn(),
      applyOptimisticContribution: jest.fn(),
      rollbackOptimistic: jest.fn(),
    });

    render(<CampaignDetailContent contractId="CONTRACT_ID" />);
    expect(document.querySelector(".animate-spin")).toBeTruthy();
  });

  it("shows error state with retry button", () => {
    const refresh = jest.fn();
    useCampaign.mockReturnValue({
      info: null,
      stats: null,
      loading: false,
      error: "Failed to load",
      refresh,
      applyOptimisticContribution: jest.fn(),
      rollbackOptimistic: jest.fn(),
    });

    render(<CampaignDetailContent contractId="CONTRACT_ID" />);
    expect(screen.getByText("Failed to load")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Retry"));
    expect(refresh).toHaveBeenCalled();
  });

  it("renders campaign metadata when loaded", () => {
    useCampaign.mockReturnValue({
      info: mockInfo,
      stats: mockStats,
      loading: false,
      error: null,
      refresh: jest.fn(),
      applyOptimisticContribution: jest.fn(),
      rollbackOptimistic: jest.fn(),
    });

    render(<CampaignDetailContent contractId="CONTRACT_ID" />);

    expect(screen.getByText("Test Campaign")).toBeInTheDocument();
    expect(screen.getByText("A great cause")).toBeInTheDocument();
    expect(screen.getByTestId("progress-bar")).toBeInTheDocument();
    expect(screen.getByTestId("countdown")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument(); // contributor count
  });

  it("shows progress bar with correct percentage", () => {
    useCampaign.mockReturnValue({
      info: mockInfo,
      stats: mockStats,
      loading: false,
      error: null,
      refresh: jest.fn(),
      applyOptimisticContribution: jest.fn(),
      rollbackOptimistic: jest.fn(),
    });

    render(<CampaignDetailContent contractId="CONTRACT_ID" />);
    const bar = screen.getByTestId("progress-bar");
    expect(Number(bar.getAttribute("data-progress"))).toBeCloseTo(50, 0);
  });

  it("shows goal success badge when goal is met", () => {
    useCampaign.mockReturnValue({
      info: { ...mockInfo, status: "Successful" as const },
      stats: { ...mockStats, totalRaised: mockStats.goal },
      loading: false,
      error: null,
      refresh: jest.fn(),
      applyOptimisticContribution: jest.fn(),
      rollbackOptimistic: jest.fn(),
    });

    render(<CampaignDetailContent contractId="CONTRACT_ID" />);
    expect(screen.getByTestId("goal-success-badge")).toBeInTheDocument();
  });

  it("shows paused banner when campaign is paused", () => {
    useCampaign.mockReturnValue({
      info: { ...mockInfo, status: "Paused" as const },
      stats: mockStats,
      loading: false,
      error: null,
      refresh: jest.fn(),
      applyOptimisticContribution: jest.fn(),
      rollbackOptimistic: jest.fn(),
    });

    render(<CampaignDetailContent contractId="CONTRACT_ID" />);
    expect(screen.getByTestId("paused-banner")).toBeInTheDocument();
  });

  it("renders social links when present", () => {
    useCampaign.mockReturnValue({
      info: { ...mockInfo, socialLinks: ["https://example.com"] },
      stats: mockStats,
      loading: false,
      error: null,
      refresh: jest.fn(),
      applyOptimisticContribution: jest.fn(),
      rollbackOptimistic: jest.fn(),
    });

    render(<CampaignDetailContent contractId="CONTRACT_ID" />);
    expect(screen.getByText("https://example.com")).toBeInTheDocument();
  });

  it("renders campaign actions component", () => {
    useCampaign.mockReturnValue({
      info: mockInfo,
      stats: mockStats,
      loading: false,
      error: null,
      refresh: jest.fn(),
      applyOptimisticContribution: jest.fn(),
      rollbackOptimistic: jest.fn(),
    });

    render(<CampaignDetailContent contractId="CONTRACT_ID" />);
    expect(screen.getByTestId("campaign-actions")).toBeInTheDocument();
  });
});
