import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import DashboardPage from "./page";

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/hooks/useWallet", () => ({
  useWallet: jest.fn(),
}));

jest.mock("@/hooks/useNotifications", () => ({
  useNotifications: () => ({ addNotification: jest.fn() }),
}));

jest.mock("@/hooks/useCampaign", () => ({
  useCampaign: jest.fn(),
}));

jest.mock("@/components/layout/Navbar", () => ({
  Navbar: () => <div data-testid="navbar" />,
}));

jest.mock("@/components/WalletGuard", () => ({
  WalletGuard: ({
    children,
    message,
  }: {
    children: React.ReactNode;
    message: string;
  }) => (
    <div data-testid="wallet-guard" data-message={message}>
      {children}
    </div>
  ),
}));

jest.mock("@/components/ui/ProgressBar", () => ({
  ProgressBar: ({ progress }: { progress: number }) => (
    <div data-testid="progress-bar" data-progress={progress} />
  ),
}));

jest.mock("@/components/ui/EmptyState", () => ({
  EmptyState: ({ title }: { title: string }) => (
    <div data-testid="empty-state">{title}</div>
  ),
  NoDashboardCampaignsIllustration: () => <div />,
}));

jest.mock("@/components/ui/DeadlineExtensionModal", () => ({
  DeadlineExtensionModal: () => <div data-testid="deadline-modal" />,
}));

jest.mock("@/components/ui/AnalyticsDashboard", () => ({
  AnalyticsDashboard: () => <div data-testid="analytics" />,
}));

jest.mock("@/components/ui/CancelCampaignModal", () => ({
  CancelCampaignModal: () => <div data-testid="cancel-modal" />,
}));

jest.mock("@/lib/soroban", () => ({
  buildWithdrawTx: jest.fn(),
  buildCancelTx: jest.fn(),
  buildPauseTx: jest.fn(),
  buildUnpauseTx: jest.fn(),
  buildUpdateMetadataTx: jest.fn(),
  submitSignedTx: jest.fn(),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

const { useWallet } = jest.requireMock("@/hooks/useWallet");
const { useCampaign } = jest.requireMock("@/hooks/useCampaign");

const mockCampaignData = {
  info: {
    title: "Test Campaign",
    description: "A test",
    creator: "GCREATOR",
    deadline: BigInt(Math.floor(Date.now() / 1000) + 86400),
    status: "Active" as const,
    socialLinks: [],
  },
  stats: {
    totalRaised: 5_000_000_000n,
    goal: 10_000_000_000n,
    contributorCount: 10,
    averageContribution: 500_000_000n,
  },
  loading: false,
  error: null,
  refresh: jest.fn(),
  applyOptimisticContribution: jest.fn(),
  rollbackOptimistic: jest.fn(),
};

function setupLocalStorage(
  address: string,
  created: string[] = [],
  contributed: string[] = [],
) {
  if (created.length > 0) {
    localStorage.setItem(
      "fmc:campaigns",
      JSON.stringify({ [address]: created }),
    );
  }
  if (contributed.length > 0) {
    localStorage.setItem(
      "fmc:contributions",
      JSON.stringify({ [address]: contributed }),
    );
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("DashboardPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    useCampaign.mockReturnValue(mockCampaignData);
    useWallet.mockReturnValue({
      address: "GUSER",
      signTx: jest.fn(),
      networkMismatch: false,
    });
  });

  it("renders navbar and wallet guard", () => {
    render(<DashboardPage />);
    expect(screen.getByTestId("navbar")).toBeInTheDocument();
    expect(screen.getByTestId("wallet-guard")).toBeInTheDocument();
  });

  it("shows empty state when no campaigns created", () => {
    render(<DashboardPage />);
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
  });

  it("shows empty backed campaigns message when no contributions", () => {
    render(<DashboardPage />);
    expect(
      screen.getByText(/haven't backed any campaigns/),
    ).toBeInTheDocument();
  });

  it("renders created campaign cards from localStorage", async () => {
    setupLocalStorage("GUSER", ["CONTRACT_1"]);
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Test Campaign")).toBeInTheDocument();
    });
  });

  it("renders contributed campaign cards from localStorage", async () => {
    setupLocalStorage("GUSER", [], ["CONTRACT_CONTRIB_1"]);
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Test Campaign")).toBeInTheDocument();
    });
  });

  it("shows statistics when campaigns exist", async () => {
    setupLocalStorage("GUSER", ["CONTRACT_1"], ["CONTRACT_CONTRIB_1"]);
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId("dashboard-stats")).toBeInTheDocument();
    });
  });

  it("shows correct counts in statistics", async () => {
    setupLocalStorage("GUSER", ["C1", "C2"], ["C3"]);
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Campaigns Created")).toBeInTheDocument();
      expect(screen.getByText("Campaigns Backed")).toBeInTheDocument();
      expect(screen.getByText("Total Campaigns")).toBeInTheDocument();
    });
  });

  it("does not show statistics when no campaigns", () => {
    render(<DashboardPage />);
    expect(screen.queryByTestId("dashboard-stats")).not.toBeInTheDocument();
  });

  it("shows My Campaigns and Campaigns I've Backed section headings", () => {
    render(<DashboardPage />);
    expect(screen.getByText("My Campaigns")).toBeInTheDocument();
    expect(screen.getByText(/Campaigns I've Backed/)).toBeInTheDocument();
  });

  it("clears campaigns when wallet disconnects", async () => {
    setupLocalStorage("GUSER", ["CONTRACT_1"]);
    const { rerender } = render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Test Campaign")).toBeInTheDocument();
    });

    useWallet.mockReturnValue({
      address: null,
      signTx: jest.fn(),
      networkMismatch: false,
    });
    rerender(<DashboardPage />);

    await waitFor(() => {
      expect(screen.queryByText("Test Campaign")).not.toBeInTheDocument();
    });
  });
});
