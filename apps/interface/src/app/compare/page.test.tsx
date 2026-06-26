import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ComparePage from "./page";

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockSelected: string[] = [];
const mockToggle = vi.fn();
const mockClear = vi.fn();
const mockIsSelected = vi.fn((id: string) => mockSelected.includes(id));
const mockBack = vi.fn();

vi.mock("@/context/ComparisonContext", () => ({
  useComparison: () => ({
    selected: mockSelected,
    toggle: mockToggle,
    clear: mockClear,
    isSelected: mockIsSelected,
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    back: mockBack,
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => "/compare",
}));

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("@/components/layout/Navbar", () => ({
  Navbar: () => <nav data-testid="navbar">Navbar</nav>,
}));

vi.mock("@/components/ui/CampaignSelector", () => ({
  CampaignSelector: () => (
    <div data-testid="campaign-selector">CampaignSelector</div>
  ),
}));

vi.mock("@/components/ui/ComparisonTable", () => ({
  ComparisonTable: ({
    campaigns,
    onRemove,
  }: {
    campaigns: unknown[];
    onRemove: (id: string) => void;
  }) => (
    <div data-testid="comparison-table">
      Table: {campaigns.length} campaigns
      <button onClick={() => onRemove("1")}>Remove 1</button>
    </div>
  ),
}));

vi.mock("@/components/ui/ComparisonChart", () => ({
  ComparisonChart: ({ campaigns }: { campaigns: unknown[] }) => (
    <div data-testid="comparison-chart">
      Chart: {campaigns.length} campaigns
    </div>
  ),
}));

vi.mock("@/lib/campaigns", () => ({
  ALL_CAMPAIGNS: [
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
      description: "AI platform",
      creator: "GDEF5678",
      raised: 8200,
      goal: 50000,
      deadline: new Date(Date.now() + 86400000).toISOString(),
      status: "Active",
      token: "XLM",
      contributorCount: 67,
      category: "education",
    },
  ],
}));

vi.mock("@/lib/utils", () => ({
  cn: (...args: unknown[]) =>
    args.filter((a) => typeof a === "string").join(" "),
}));

// ── Tests ────────────────────────────────────────────────────────────────────

describe("ComparePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelected.length = 0;
  });

  describe("Empty state", () => {
    it("renders empty state when no campaigns are selected", () => {
      render(<ComparePage />);
      expect(screen.getByText("Compare Campaigns")).toBeInTheDocument();
      expect(
        screen.getByText(/Select up to 4 campaigns/),
      ).toBeInTheDocument();
    });

    it("renders the campaign selector in empty state", () => {
      render(<ComparePage />);
      expect(screen.getByTestId("campaign-selector")).toBeInTheDocument();
    });

    it("renders a link to browse campaigns", () => {
      render(<ComparePage />);
      expect(screen.getByText("browse campaigns")).toHaveAttribute(
        "href",
        "/campaigns",
      );
    });

    it("renders the navbar", () => {
      render(<ComparePage />);
      expect(screen.getByTestId("navbar")).toBeInTheDocument();
    });
  });

  describe("With selected campaigns", () => {
    beforeEach(() => {
      mockSelected.push("1", "2");
    });

    it("renders the comparison table", () => {
      render(<ComparePage />);
      expect(screen.getByTestId("comparison-table")).toBeInTheDocument();
    });

    it("renders the comparison chart", () => {
      render(<ComparePage />);
      expect(screen.getByTestId("comparison-chart")).toBeInTheDocument();
    });

    it("shows the campaign count", () => {
      render(<ComparePage />);
      expect(screen.getByText("2 of 4 campaigns selected")).toBeInTheDocument();
    });

    it("renders Share and Clear buttons", () => {
      render(<ComparePage />);
      expect(screen.getByLabelText("Share comparison")).toBeInTheDocument();
      expect(screen.getByLabelText("Clear all campaigns")).toBeInTheDocument();
    });

    it("calls clear when Clear button is clicked", () => {
      render(<ComparePage />);
      fireEvent.click(screen.getByLabelText("Clear all campaigns"));
      expect(mockClear).toHaveBeenCalledTimes(1);
    });

    it("calls router.back when back button is clicked", () => {
      render(<ComparePage />);
      fireEvent.click(screen.getByLabelText("Go back"));
      expect(mockBack).toHaveBeenCalledTimes(1);
    });

    it("renders view mode toggle buttons", () => {
      render(<ComparePage />);
      expect(screen.getByText("Both")).toBeInTheDocument();
      expect(screen.getByText("Table")).toBeInTheDocument();
      expect(screen.getByText("Chart")).toBeInTheDocument();
    });

    it("hides chart when Table view is selected", () => {
      render(<ComparePage />);
      fireEvent.click(screen.getByText("Table"));
      expect(screen.getByTestId("comparison-table")).toBeInTheDocument();
      expect(screen.queryByTestId("comparison-chart")).not.toBeInTheDocument();
    });

    it("hides table when Chart view is selected", () => {
      render(<ComparePage />);
      fireEvent.click(screen.getByText("Chart"));
      expect(screen.queryByTestId("comparison-table")).not.toBeInTheDocument();
      expect(screen.getByTestId("comparison-chart")).toBeInTheDocument();
    });

    it("shows both table and chart in Both view", () => {
      render(<ComparePage />);
      // Default is "both"
      expect(screen.getByTestId("comparison-table")).toBeInTheDocument();
      expect(screen.getByTestId("comparison-chart")).toBeInTheDocument();
    });

    it("calls toggle when removing from table", () => {
      render(<ComparePage />);
      fireEvent.click(screen.getByText("Remove 1"));
      expect(mockToggle).toHaveBeenCalledWith("1");
    });

    it("renders the campaign selector for adding more", () => {
      render(<ComparePage />);
      expect(screen.getByTestId("campaign-selector")).toBeInTheDocument();
    });
  });
});
