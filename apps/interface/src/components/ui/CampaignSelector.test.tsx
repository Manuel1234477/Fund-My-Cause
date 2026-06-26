import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CampaignSelector } from "./CampaignSelector";

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockToggle = vi.fn();
const mockSelected: string[] = [];
const mockIsSelected = vi.fn((id: string) => mockSelected.includes(id));

vi.mock("@/context/ComparisonContext", () => ({
  useComparison: () => ({
    selected: mockSelected,
    toggle: mockToggle,
    isSelected: mockIsSelected,
    clear: vi.fn(),
  }),
}));

vi.mock("@/lib/campaigns", () => ({
  ALL_CAMPAIGNS: [
    {
      id: "1",
      contractId: "1",
      title: "Eco-Friendly Water Purification",
      description: "Solar-powered water purification",
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
      title: "Open Source AI Education",
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
      title: "Community Solar Microgrid",
      description: "Solar energy sharing",
      creator: "GHIJ9012",
      raised: 45000,
      goal: 45000,
      deadline: new Date(Date.now() + 86400000).toISOString(),
      status: "Successful",
      token: "XLM",
      contributorCount: 310,
      category: "environment",
    },
  ],
}));

vi.mock("@/lib/utils", () => ({
  cn: (...args: unknown[]) =>
    args.filter((a) => typeof a === "string").join(" "),
}));

// ── Tests ────────────────────────────────────────────────────────────────────

describe("CampaignSelector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelected.length = 0;
  });

  it("renders the Add Campaign button", () => {
    render(<CampaignSelector />);
    expect(screen.getByLabelText("Add campaign to comparison")).toBeInTheDocument();
    expect(screen.getByText("Add Campaign")).toBeInTheDocument();
  });

  it("opens the dropdown when clicked", () => {
    render(<CampaignSelector />);
    fireEvent.click(screen.getByText("Add Campaign"));
    expect(screen.getByLabelText("Available campaigns")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search campaigns...")).toBeInTheDocument();
  });

  it("shows available campaigns in dropdown", () => {
    render(<CampaignSelector />);
    fireEvent.click(screen.getByText("Add Campaign"));
    expect(screen.getByText("Eco-Friendly Water Purification")).toBeInTheDocument();
    expect(screen.getByText("Open Source AI Education")).toBeInTheDocument();
    expect(screen.getByText("Community Solar Microgrid")).toBeInTheDocument();
  });

  it("filters campaigns by search query", () => {
    render(<CampaignSelector />);
    fireEvent.click(screen.getByText("Add Campaign"));
    const searchInput = screen.getByPlaceholderText("Search campaigns...");
    fireEvent.change(searchInput, { target: { value: "Solar" } });
    expect(screen.getByText("Community Solar Microgrid")).toBeInTheDocument();
    expect(screen.queryByText("Open Source AI Education")).not.toBeInTheDocument();
  });

  it("calls toggle when a campaign is selected", () => {
    render(<CampaignSelector />);
    fireEvent.click(screen.getByText("Add Campaign"));
    fireEvent.click(screen.getByText("Open Source AI Education"));
    expect(mockToggle).toHaveBeenCalledWith("2");
  });

  it("hides already-selected campaigns from dropdown", () => {
    mockSelected.push("1");
    mockIsSelected.mockImplementation((id: string) => mockSelected.includes(id));
    render(<CampaignSelector />);
    fireEvent.click(screen.getByText("Add Campaign"));
    expect(screen.queryByText("Eco-Friendly Water Purification")).not.toBeInTheDocument();
    expect(screen.getByText("Open Source AI Education")).toBeInTheDocument();
  });

  it("disables button when 4 campaigns are selected", () => {
    mockSelected.push("1", "2", "3", "4");
    render(<CampaignSelector />);
    const button = screen.getByLabelText("Add campaign to comparison");
    expect(button).toBeDisabled();
  });

  it("shows selection count in footer", () => {
    mockSelected.push("1", "2");
    render(<CampaignSelector />);
    fireEvent.click(screen.getByText("Add Campaign"));
    expect(screen.getByText("2/4 campaigns selected")).toBeInTheDocument();
  });

  it("shows 'No campaigns found' when search has no results", () => {
    render(<CampaignSelector />);
    fireEvent.click(screen.getByText("Add Campaign"));
    const searchInput = screen.getByPlaceholderText("Search campaigns...");
    fireEvent.change(searchInput, { target: { value: "xyznonsense" } });
    expect(screen.getByText("No campaigns found")).toBeInTheDocument();
  });
});
