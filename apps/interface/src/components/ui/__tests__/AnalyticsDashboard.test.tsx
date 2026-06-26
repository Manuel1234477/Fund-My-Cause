import { render, screen } from "@testing-library/react";
import { AnalyticsDashboard } from "../AnalyticsDashboard";
import { CampaignData } from "@/types/soroban";

const mockCampaigns: CampaignData[] = [
  {
    contractId: "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    title: "Test Campaign 1",
    description: "A test campaign",
    raised: 500,
    goal: 1000,
    deadline: new Date(Date.now() + 86400000).toISOString(),
    creator: "GABCDE",
    socialLinks: [],
    contributorCount: 10,
    averageContribution: 50,
    status: "Active",
  },
  {
    contractId: "CBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    title: "Test Campaign 2",
    description: "Another test campaign",
    raised: 800,
    goal: 1000,
    deadline: new Date(Date.now() + 86400000).toISOString(),
    creator: "GFEDCBA",
    socialLinks: [],
    contributorCount: 20,
    averageContribution: 40,
    status: "Successful",
  },
];

describe("AnalyticsDashboard", () => {
  it("renders empty state when no campaigns are provided", () => {
    render(<AnalyticsDashboard campaigns={[]} />);
    expect(screen.getByText("No campaign data to analyze yet.")).toBeInTheDocument();
  });

  it("renders summary stats cards", () => {
    render(<AnalyticsDashboard campaigns={mockCampaigns} />);
    expect(screen.getByText(/Total Raised/)).toBeInTheDocument();
    expect(screen.getByText(/Active Campaigns/)).toBeInTheDocument();
    expect(screen.getByText(/Successful/)).toBeInTheDocument();
    expect(screen.getByText(/Avg. Conversion/)).toBeInTheDocument();
  });

  it("displays correct total raised amount", () => {
    render(<AnalyticsDashboard campaigns={mockCampaigns} />);
    const totalRaised = mockCampaigns.reduce((sum, c) => sum + c.raised, 0);
    expect(screen.getByText(/1,300/)).toBeInTheDocument(); // 500 + 800
  });

  it("displays correct active campaign count", () => {
    render(<AnalyticsDashboard campaigns={mockCampaigns} />);
    const activeCount = mockCampaigns.filter((c) => c.status === "Active").length;
    expect(screen.getByText(String(activeCount))).toBeInTheDocument();
  });

  it("displays correct successful campaign count", () => {
    render(<AnalyticsDashboard campaigns={mockCampaigns} />);
    const successfulCount = mockCampaigns.filter((c) => c.status === "Successful").length;
    expect(screen.getByText(String(successfulCount))).toBeInTheDocument();
  });

  it("renders chart components", () => {
    render(<AnalyticsDashboard campaigns={mockCampaigns} />);
    expect(screen.getByText(/Funding Progress Over Time/)).toBeInTheDocument();
    expect(screen.getByText(/Campaign Status Distribution/)).toBeInTheDocument();
  });

  it("renders raised per campaign section", () => {
    render(<AnalyticsDashboard campaigns={mockCampaigns} />);
    expect(screen.getByText(/Raised per Campaign/)).toBeInTheDocument();
  });

  it("renders conversion funnel section", () => {
    render(<AnalyticsDashboard campaigns={mockCampaigns} />);
    expect(screen.getByText(/Conversion Funnel/)).toBeInTheDocument();
  });

  it("renders export component", () => {
    render(<AnalyticsDashboard campaigns={mockCampaigns} />);
    expect(screen.getByText(/Export:/)).toBeInTheDocument();
  });
});
