import { render, screen, act } from "@testing-library/react";
import { LimitedConnectivityBanner, StaleBadge } from "../LimitedConnectivityBanner";
import { rpcFailure, rpcSuccess, rpcReset, RPC_FAILURE_THRESHOLD } from "@/lib/rpc-cache";

beforeEach(() => {
  rpcReset();
});

function triggerLimited() {
  for (let i = 0; i < RPC_FAILURE_THRESHOLD; i++) rpcFailure();
}

describe("LimitedConnectivityBanner", () => {
  it("renders nothing when connectivity is healthy", () => {
    const { container } = render(<LimitedConnectivityBanner />);
    expect(container.firstChild).toBeNull();
  });

  it("shows banner after RPC_FAILURE_THRESHOLD failures", () => {
    render(<LimitedConnectivityBanner />);
    act(() => { triggerLimited(); });
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/Limited connectivity/)).toBeInTheDocument();
  });

  it("hides banner when RPC recovers", () => {
    render(<LimitedConnectivityBanner />);
    act(() => { triggerLimited(); });
    expect(screen.getByRole("status")).toBeInTheDocument();
    act(() => { rpcSuccess(); });
    expect(screen.queryByRole("status")).toBeNull();
  });
});

describe("StaleBadge", () => {
  it("renders nothing when healthy", () => {
    const { container } = render(<StaleBadge />);
    expect(container.firstChild).toBeNull();
  });

  it("shows 'cached' badge during degradation", () => {
    render(<StaleBadge />);
    act(() => { triggerLimited(); });
    expect(screen.getByText("cached")).toBeInTheDocument();
  });
});
