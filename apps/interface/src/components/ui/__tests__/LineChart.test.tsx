import { render, screen } from "@testing-library/react";
import { LineChart } from "../LineChart";
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

describe("LineChart", () => {
  it("renders nothing when no campaigns are provided", () => {
    const { container } = render(<LineChart campaigns={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders chart title", () => {
    render(<LineChart campaigns={mockCampaigns} />);
    expect(screen.getByText(/Funding Progress Over Time/)).toBeInTheDocument();
  });

  it("renders SVG element", () => {
    const { container } = render(<LineChart campaigns={mockCampaigns} />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("renders legend items", () => {
    render(<LineChart campaigns={mockCampaigns} />);
    expect(screen.getByText(/Test Campaign 1/)).toBeInTheDocument();
    expect(screen.getByText(/Test Campaign 2/)).toBeInTheDocument();
  });

  it("shows '+ more' indicator when there are more than 5 campaigns", () => {
    const manyCampaigns: CampaignData[] = Array.from({ length: 6 }, (_, i) => ({
      contractId: `C${"A".repeat(55)}`,
      title: `Campaign ${i + 1}`,
      description: `Description ${i + 1}`,
      raised: 100 * (i + 1),
      goal: 1000,
      deadline: new Date(Date.now() + 86400000).toISOString(),
      creator: "GABCDE",
      socialLinks: [],
      contributorCount: 10,
      averageContribution: 50,
      status: "Active",
    }));
    
    render(<LineChart campaigns={manyCampaigns} />);
    expect(screen.getByText(/\+1 more/)).toBeInTheDocument();
  });
});
