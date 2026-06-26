import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ComparisonChart } from "./ComparisonChart";
import type { Campaign } from "@/types/campaign";

vi.mock("@/lib/utils", () => ({
  cn: (...args: unknown[]) =>
    args.filter((a) => typeof a === "string").join(" "),
}));

const mockCampaigns: Campaign[] = [
  {
    id: "1",
    contractId: "1",
    title: "Eco Water",
    description: "Water purification",
    creator: "GABC1234",
    raised: 15400,
    goal: 20000,
    deadline: new Date(Date.now() + 86400000).toISOString(),
    status: "Active",
    token: "XLM",
    contributorCount: 142,
    category: "environment",
  },
  {
    id: "2",
    contractId: "2",
    title: "AI Education",
    description: "AI education platform",
    creator: "GDEF5678",
    raised: 8200,
    goal: 50000,
    deadline: new Date(Date.now() + 86400000).toISOString(),
    status: "Active",
    token: "XLM",
    contributorCount: 67,
    category: "education",
  },
  {
    id: "3",
    contractId: "3",
    title: "Solar Grid",
    description: "Solar energy",
    creator: "GHIJ9012",
    raised: 45000,
    goal: 45000,
    deadline: new Date(Date.now() + 86400000).toISOString(),
    status: "Successful",
    token: "XLM",
    contributorCount: 310,
    category: "environment",
  },
];

describe("ComparisonChart", () => {
  it("renders the chart container", () => {
    render(<ComparisonChart campaigns={mockCampaigns} />);
    expect(screen.getByTestId("comparison-chart")).toBeInTheDocument();
  });

  it("renders the visual comparison heading", () => {
    render(<ComparisonChart campaigns={mockCampaigns} />);
    expect(screen.getByText("Visual Comparison")).toBeInTheDocument();
  });

  it("renders metric toggle buttons", () => {
    render(<ComparisonChart campaigns={mockCampaigns} />);
    expect(screen.getByText("Amount Raised")).toBeInTheDocument();
    expect(screen.getByText("Goal")).toBeInTheDocument();
    expect(screen.getByText("Progress %")).toBeInTheDocument();
    expect(screen.getByText("Contributors")).toBeInTheDocument();
  });

  it("renders campaign titles as bar labels", () => {
    render(<ComparisonChart campaigns={mockCampaigns} />);
    expect(screen.getByText("Eco Water")).toBeInTheDocument();
    expect(screen.getByText("AI Education")).toBeInTheDocument();
    expect(screen.getByText("Solar Grid")).toBeInTheDocument();
  });

  it("renders values for the default metric (raised)", () => {
    render(<ComparisonChart campaigns={mockCampaigns} />);
    expect(screen.getByTestId("chart-value-1")).toHaveTextContent("XLM");
    expect(screen.getByTestId("chart-value-2")).toHaveTextContent("XLM");
    expect(screen.getByTestId("chart-value-3")).toHaveTextContent("XLM");
  });

  it("switches metric when toggle button is clicked", () => {
    render(<ComparisonChart campaigns={mockCampaigns} />);
    fireEvent.click(screen.getByText("Contributors"));
    // Should show contributor counts now
    expect(screen.getByTestId("chart-value-1")).toHaveTextContent("142");
    expect(screen.getByTestId("chart-value-2")).toHaveTextContent("67");
    expect(screen.getByTestId("chart-value-3")).toHaveTextContent("310");
  });

  it("shows progress percentages when Progress % metric is selected", () => {
    render(<ComparisonChart campaigns={mockCampaigns} />);
    fireEvent.click(screen.getByText("Progress %"));
    expect(screen.getByTestId("chart-value-1")).toHaveTextContent("77%");
    expect(screen.getByTestId("chart-value-2")).toHaveTextContent("16%");
    expect(screen.getByTestId("chart-value-3")).toHaveTextContent("100%");
  });

  it("renders legend items for each campaign", () => {
    render(<ComparisonChart campaigns={mockCampaigns} />);
    const legend = screen.getByLabelText("Chart legend");
    expect(legend).toBeInTheDocument();
  });

  it("renders summary stat cards", () => {
    render(<ComparisonChart campaigns={mockCampaigns} />);
    // Each campaign should have a summary card with funded percentage
    const fundedLabels = screen.getAllByText("funded");
    expect(fundedLabels.length).toBe(mockCampaigns.length);
  });

  it("returns null when no campaigns are provided", () => {
    const { container } = render(<ComparisonChart campaigns={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders bar elements with meter roles", () => {
    render(<ComparisonChart campaigns={mockCampaigns} />);
    const meters = screen.getAllByRole("meter");
    expect(meters.length).toBe(mockCampaigns.length);
  });
});
