"use client";

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CampaignActions } from "./CampaignActions";

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock("@/context/WalletContext", () => ({
  useWallet: jest.fn(),
}));

jest.mock("@/context/NotificationContext", () => ({
  useNotifications: () => ({ addNotification: jest.fn() }),
}));

jest.mock("@/lib/contract", () => ({
  withdraw: jest.fn(),
  refundSingle: jest.fn(),
  getCampaignStats: jest.fn(),
  pauseCampaign: jest.fn(),
  unpauseCampaign: jest.fn(),
}));

jest.mock("@/lib/soroban", () => ({
  fetchContribution: jest.fn().mockResolvedValue(0),
  buildWithdrawTx: jest.fn(),
  simulateTx: jest.fn(),
  submitSignedTx: jest.fn(),
  buildRefundTx: jest.fn(),
}));

jest.mock("@/components/ui/PledgeModal", () => ({
  PledgeModal: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="pledge-modal">
      <button onClick={onClose}>Close Pledge</button>
    </div>
  ),
}));

jest.mock("@/components/ui/TransactionStatus", () => ({
  TransactionStatus: ({ status }: { status: string }) => (
    <div data-testid="tx-status">{status}</div>
  ),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

const { useWallet } = jest.requireMock("@/context/WalletContext");
const { withdraw, refundSingle } = jest.requireMock("@/lib/contract");
const { fetchContribution } = jest.requireMock("@/lib/soroban");

const baseProps = {
  contractId: "CONTRACT_ID",
  creator: "GCREATOR",
  deadlinePassed: false,
  goalMet: false,
  campaignTitle: "Test Campaign",
  status: "Active" as const,
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("CampaignActions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchContribution.mockResolvedValue(0);
    useWallet.mockReturnValue({
      address: null,
      connect: jest.fn(),
      signTx: jest.fn(),
      networkMismatch: false,
    });
  });

  it("shows connect wallet button when not connected", () => {
    render(<CampaignActions {...baseProps} />);
    expect(screen.getByText("Connect Wallet to Pledge")).toBeInTheDocument();
  });

  it("calls connect when unauthenticated user clicks pledge", () => {
    const connect = jest.fn();
    useWallet.mockReturnValue({ address: null, connect, signTx: jest.fn(), networkMismatch: false });

    render(<CampaignActions {...baseProps} />);
    fireEvent.click(screen.getByText("Connect Wallet to Pledge"));
    expect(connect).toHaveBeenCalled();
  });

  it("shows Pledge Now button when wallet is connected and campaign is active", () => {
    useWallet.mockReturnValue({
      address: "GCONTRIBUTOR",
      connect: jest.fn(),
      signTx: jest.fn(),
      networkMismatch: false,
    });

    render(<CampaignActions {...baseProps} />);
    expect(screen.getByText("Pledge Now")).toBeInTheDocument();
  });

  it("opens pledge modal when Pledge Now is clicked", () => {
    useWallet.mockReturnValue({
      address: "GCONTRIBUTOR",
      connect: jest.fn(),
      signTx: jest.fn(),
      networkMismatch: false,
    });

    render(<CampaignActions {...baseProps} />);
    fireEvent.click(screen.getByText("Pledge Now"));
    expect(screen.getByTestId("pledge-modal")).toBeInTheDocument();
  });

  it("closes pledge modal when onClose is called", () => {
    useWallet.mockReturnValue({
      address: "GCONTRIBUTOR",
      connect: jest.fn(),
      signTx: jest.fn(),
      networkMismatch: false,
    });

    render(<CampaignActions {...baseProps} />);
    fireEvent.click(screen.getByText("Pledge Now"));
    fireEvent.click(screen.getByText("Close Pledge"));
    expect(screen.queryByTestId("pledge-modal")).not.toBeInTheDocument();
  });

  it("shows Withdraw Funds button for creator when goal is met and deadline passed", () => {
    useWallet.mockReturnValue({
      address: "GCREATOR",
      connect: jest.fn(),
      signTx: jest.fn(),
      networkMismatch: false,
    });

    render(
      <CampaignActions
        {...baseProps}
        deadlinePassed={true}
        goalMet={true}
      />
    );
    expect(screen.getByText("Withdraw Funds")).toBeInTheDocument();
  });

  it("shows Claim Refund button when contributor has contribution and deadline passed without goal", async () => {
    fetchContribution.mockResolvedValue(100);
    useWallet.mockReturnValue({
      address: "GCONTRIBUTOR",
      connect: jest.fn(),
      signTx: jest.fn(),
      networkMismatch: false,
    });

    render(
      <CampaignActions
        {...baseProps}
        deadlinePassed={true}
        goalMet={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Claim Refund/)).toBeInTheDocument();
    });
  });

  it("shows paused button when campaign is paused", () => {
    useWallet.mockReturnValue({
      address: "GCONTRIBUTOR",
      connect: jest.fn(),
      signTx: jest.fn(),
      networkMismatch: false,
    });

    render(<CampaignActions {...baseProps} status="Paused" />);
    expect(screen.getByText("Contributions Paused")).toBeInTheDocument();
  });

  it("shows pause button for creator on active campaign", () => {
    useWallet.mockReturnValue({
      address: "GCREATOR",
      connect: jest.fn(),
      signTx: jest.fn(),
      networkMismatch: false,
    });

    render(<CampaignActions {...baseProps} />);
    expect(screen.getByText("Pause Campaign")).toBeInTheDocument();
  });

  it("shows resume button for creator on paused campaign", () => {
    useWallet.mockReturnValue({
      address: "GCREATOR",
      connect: jest.fn(),
      signTx: jest.fn(),
      networkMismatch: false,
    });

    render(<CampaignActions {...baseProps} status="Paused" />);
    expect(screen.getByText("Resume Campaign")).toBeInTheDocument();
  });

  it("shows paused notice for non-creator on paused campaign", () => {
    useWallet.mockReturnValue({
      address: "GCONTRIBUTOR",
      connect: jest.fn(),
      signTx: jest.fn(),
      networkMismatch: false,
    });

    render(<CampaignActions {...baseProps} status="Paused" />);
    expect(
      screen.getByText(/This campaign is currently paused/)
    ).toBeInTheDocument();
  });

  it("calls withdraw on button click", async () => {
    const signTx = jest.fn().mockResolvedValue("signed-xdr");
    withdraw.mockResolvedValue("tx-hash-123");
    useWallet.mockReturnValue({
      address: "GCREATOR",
      connect: jest.fn(),
      signTx,
      networkMismatch: false,
    });

    render(
      <CampaignActions
        {...baseProps}
        deadlinePassed={true}
        goalMet={true}
      />
    );

    fireEvent.click(screen.getByText("Withdraw Funds"));
    await waitFor(() => expect(withdraw).toHaveBeenCalled());
  });
});
