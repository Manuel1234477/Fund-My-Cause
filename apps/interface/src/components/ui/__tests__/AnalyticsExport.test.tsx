import { render, screen, fireEvent } from "@testing-library/react";
import { AnalyticsExport } from "../AnalyticsExport";
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
];

describe("AnalyticsExport", () => {
  it("renders export label", () => {
    render(<AnalyticsExport campaigns={mockCampaigns} />);
    expect(screen.getByText(/Export:/)).toBeInTheDocument();
  });

  it("renders CSV export button", () => {
    render(<AnalyticsExport campaigns={mockCampaigns} />);
    expect(screen.getByText(/CSV/)).toBeInTheDocument();
  });

  it("renders JSON export button", () => {
    render(<AnalyticsExport campaigns={mockCampaigns} />);
    expect(screen.getByText(/JSON/)).toBeInTheDocument();
  });

  it("renders TXT export button", () => {
    render(<AnalyticsExport campaigns={mockCampaigns} />);
    expect(screen.getByText(/TXT/)).toBeInTheDocument();
  });

  it("disables all buttons when one is clicked", () => {
    render(<AnalyticsExport campaigns={mockCampaigns} />);
    const csvButton = screen.getByText(/CSV/).closest("button");
    const jsonButton = screen.getByText(/JSON/).closest("button");
    const txtButton = screen.getByText(/TXT/).closest("button");

    if (csvButton) {
      fireEvent.click(csvButton);
      expect(csvButton).toBeDisabled();
      if (jsonButton) expect(jsonButton).toBeDisabled();
      if (txtButton) expect(txtButton).toBeDisabled();
    }
  });

  it("handles empty campaigns array", () => {
    render(<AnalyticsExport campaigns={[]} />);
    expect(screen.getByText(/Export:/)).toBeInTheDocument();
  });
});
