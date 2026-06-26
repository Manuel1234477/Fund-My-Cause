import { render, screen } from "@testing-library/react";
import { PieChart } from "../PieChart";
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

describe("PieChart", () => {
  it("renders nothing when no campaigns are provided", () => {
    const { container } = render(<PieChart campaigns={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders chart title", () => {
    render(<PieChart campaigns={mockCampaigns} />);
    expect(screen.getByText(/Campaign Status Distribution/)).toBeInTheDocument();
  });

  it("renders SVG element", () => {
    const { container } = render(<PieChart campaigns={mockCampaigns} />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("displays total campaign count in center", () => {
    render(<PieChart campaigns={mockCampaigns} />);
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
  });

  it("renders legend items for each status", () => {
    render(<PieChart campaigns={mockCampaigns} />);
    expect(screen.getByText(/Active/)).toBeInTheDocument();
    expect(screen.getByText(/Successful/)).toBeInTheDocument();
  });

  it("displays correct count for each status", () => {
    render(<PieChart campaigns={mockCampaigns} />);
    expect(screen.getByText(/1/)).toBeInTheDocument();
  });

  it("displays percentage for each status", () => {
    render(<PieChart campaigns={mockCampaigns} />);
    expect(screen.getByText(/50.0%/)).toBeInTheDocument();
  });

  it("handles campaigns with different statuses", () => {
    const mixedCampaigns: CampaignData[] = [
      ...mockCampaigns,
      {
        contractId: "CCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        title: "Test Campaign 3",
        description: "Cancelled campaign",
        raised: 100,
        goal: 1000,
        deadline: new Date(Date.now() + 86400000).toISOString(),
        creator: "G12345",
        socialLinks: [],
        contributorCount: 5,
        averageContribution: 20,
        status: "Cancelled",
      },
    ];
    
    render(<PieChart campaigns={mixedCampaigns} />);
    expect(screen.getByText(/Cancelled/)).toBeInTheDocument();
  });
});
