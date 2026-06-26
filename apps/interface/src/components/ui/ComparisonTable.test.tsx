import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ComparisonTable } from "./ComparisonTable";
import type { Campaign } from "@/types/campaign";

vi.mock("@/lib/utils", () => ({
  cn: (...args: unknown[]) =>
    args.filter((a) => typeof a === "string").join(" "),
}));

vi.mock("@/lib/price", () => ({
  formatXlm: (xlm: number) => `${xlm.toLocaleString()} XLM`,
}));

vi.mock("@/components/ui/ProgressBar", () => ({
  ProgressBar: ({ progress }: { progress: number }) => (
    <div role="progressbar" aria-valuenow={Math.round(progress)}>
      {Math.round(progress)}%
    </div>
  ),
}));

const mockCampaigns: Campaign[] = [
  {
    id: "1",
    contractId: "1",
    title: "Eco Water",
    description: "Water purification",
    creator: "GABC1234ECOFRIENDLY",
    raised: 15400,
    goal: 20000,
    deadline: new Date(Date.now() + 5 * 86400000).toISOString(),
    status: "Active",
    token: "XLM",
    contributorCount: 142,
    category: "environment",
  },
  {
    id: "2",
    contractId: "2",
    title: "AI Education",
    description: "AI platform",
    creator: "GDEF5678AIEDUCATION",
    raised: 8200,
    goal: 50000,
    deadline: new Date(Date.now() + 12 * 86400000).toISOString(),
    status: "Active",
    token: "XLM",
    contributorCount: 67,
    category: "education",
  },
];

const mockOnRemove = vi.fn();

describe("ComparisonTable", () => {
  it("renders the table container", () => {
    render(
      <ComparisonTable campaigns={mockCampaigns} onRemove={mockOnRemove} />,
    );
    expect(screen.getByTestId("comparison-table")).toBeInTheDocument();
  });

  it("renders campaign titles as column headers", () => {
    render(
      <ComparisonTable campaigns={mockCampaigns} onRemove={mockOnRemove} />,
    );
    expect(screen.getByText("Eco Water")).toBeInTheDocument();
    expect(screen.getByText("AI Education")).toBeInTheDocument();
  });

  it("renders all metric rows", () => {
    render(
      <ComparisonTable campaigns={mockCampaigns} onRemove={mockOnRemove} />,
    );
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Amount Raised")).toBeInTheDocument();
    expect(screen.getByText("Goal")).toBeInTheDocument();
    expect(screen.getByText("Progress")).toBeInTheDocument();
    expect(screen.getByText("Deadline")).toBeInTheDocument();
    expect(screen.getByText("Contributors")).toBeInTheDocument();
    expect(screen.getByText("Token")).toBeInTheDocument();
    expect(screen.getByText("Category")).toBeInTheDocument();
  });

  it("renders campaign statuses", () => {
    render(
      <ComparisonTable campaigns={mockCampaigns} onRemove={mockOnRemove} />,
    );
    const activeStatuses = screen.getAllByText("Active");
    expect(activeStatuses.length).toBe(2);
  });

  it("renders remove buttons for each campaign", () => {
    render(
      <ComparisonTable campaigns={mockCampaigns} onRemove={mockOnRemove} />,
    );
    expect(
      screen.getByLabelText("Remove Eco Water from comparison"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Remove AI Education from comparison"),
    ).toBeInTheDocument();
  });

  it("calls onRemove when remove button is clicked", () => {
    render(
      <ComparisonTable campaigns={mockCampaigns} onRemove={mockOnRemove} />,
    );
    fireEvent.click(screen.getByLabelText("Remove Eco Water from comparison"));
    expect(mockOnRemove).toHaveBeenCalledWith("1");
  });

  it("renders progress bars for each campaign", () => {
    render(
      <ComparisonTable campaigns={mockCampaigns} onRemove={mockOnRemove} />,
    );
    const progressBars = screen.getAllByRole("progressbar");
    expect(progressBars.length).toBe(2);
  });

  it("shows token badges", () => {
    render(
      <ComparisonTable campaigns={mockCampaigns} onRemove={mockOnRemove} />,
    );
    const xlmBadges = screen.getAllByText("XLM");
    // At minimum: the raised/goal XLM values + token badges
    expect(xlmBadges.length).toBeGreaterThanOrEqual(2);
  });

  it("shows category information", () => {
    render(
      <ComparisonTable campaigns={mockCampaigns} onRemove={mockOnRemove} />,
    );
    expect(screen.getByText("environment")).toBeInTheDocument();
    expect(screen.getByText("education")).toBeInTheDocument();
  });

  it("displays creator addresses (truncated)", () => {
    render(
      <ComparisonTable campaigns={mockCampaigns} onRemove={mockOnRemove} />,
    );
    expect(screen.getByText(/by GABC1234/)).toBeInTheDocument();
    expect(screen.getByText(/by GDEF5678/)).toBeInTheDocument();
  });

  it("highlights the highest progress campaign", () => {
    render(
      <ComparisonTable campaigns={mockCampaigns} onRemove={mockOnRemove} />,
    );
    // Eco Water has 77% progress (highest), should have "★ Highest" indicator
    expect(screen.getByText("★ Highest")).toBeInTheDocument();
  });

  it("returns null when no campaigns are provided", () => {
    const { container } = render(
      <ComparisonTable campaigns={[]} onRemove={mockOnRemove} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("has proper table role", () => {
    render(
      <ComparisonTable campaigns={mockCampaigns} onRemove={mockOnRemove} />,
    );
    expect(screen.getByRole("table")).toBeInTheDocument();
  });
});
