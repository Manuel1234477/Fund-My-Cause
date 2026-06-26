import {
  rpc as SorobanRpc,
  Contract,
  TransactionBuilder,
  BASE_FEE,
  scValToNative,
  nativeToScVal,
  Address,
  Horizon,
} from "@stellar/stellar-sdk";

import type {
  FmcClientConfig,
  CampaignStats,
  CampaignInfo,
  PerformanceMetrics,
  ContributionRecord,
  MatchingConfig,
  ContributeOptions,
  WithdrawOptions,
  RefundOptions,
  SetupMatchingOptions,
  RefundMatchingSponsorOptions,
  CancelOptions,
  ListContributorsOptions,
} from "./types";
import { parseAndThrow } from "./errors";

const STROOPS = 10_000_000n;

function xlmToStroops(xlm: number): bigint {
  return BigInt(Math.round(xlm * 1e7));
}

function stroopsToXlm(stroops: bigint): number {
  return Number(stroops) / 1e7;
}

export class FmcClient {
  private readonly rpc: SorobanRpc.Server;
  private readonly horizon: Horizon.Server;
  private readonly contract: Contract;
  private readonly config: FmcClientConfig;

  constructor(config: FmcClientConfig) {
    this.config   = config;
    this.rpc      = new SorobanRpc.Server(config.rpcUrl);
    this.horizon  = new Horizon.Server(config.horizonUrl);
    this.contract = new Contract(config.contractId);
  }

  // ── Internal helpers ───────────────────────────────────────────────────────

  /** Execute a view (read-only) call via simulateTransaction. */
  private async view<T>(method: string, args: Parameters<typeof nativeToScVal>[0][] = []): Promise<T> {
    // Use a well-known funded account for simulation — never submitted
    const DUMMY = "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN";
    const account = { accountId: () => DUMMY, sequenceNumber: () => "0", incrementSequenceNumber: () => {} } as unknown as Parameters<typeof TransactionBuilder>[0];

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: this.config.networkPassphrase,
    })
      .addOperation(this.contract.call(method, ...args))
      .setTimeout(30)
      .build();

    const result = await this.rpc.simulateTransaction(tx);
    if (SorobanRpc.Api.isSimulationError(result)) {
      parseAndThrow(result.error);
    }
    return scValToNative((result as SorobanRpc.Api.SimulateTransactionSuccessResponse).result!.retval) as T;
  }

  /** Build, prepare, sign, submit, and poll a state-changing transaction. */
  private async invoke(
    caller: string,
    method: string,
    args: Parameters<typeof nativeToScVal>[0][],
    signTx: (xdr: string) => Promise<string>,
  ): Promise<string> {
    const account  = await this.horizon.loadAccount(caller);
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: this.config.networkPassphrase,
    })
      .addOperation(this.contract.call(method, ...args))
      .setTimeout(30)
      .build();

    const prepared   = await this.rpc.prepareTransaction(tx);
    const signedXdr  = await signTx(prepared.toXDR());
    const signedTx   = TransactionBuilder.fromXDR(signedXdr, this.config.networkPassphrase);
    const sendResult = await this.rpc.sendTransaction(signedTx);

    if (sendResult.status === "ERROR") {
      parseAndThrow(JSON.stringify(sendResult.errorResult));
    }

    return this.poll(sendResult.hash);
  }

  private async poll(hash: string): Promise<string> {
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 1500));
      const res = await this.rpc.getTransaction(hash);
      if (res.status === SorobanRpc.Api.GetTransactionStatus.SUCCESS)  return hash;
      if (res.status === SorobanRpc.Api.GetTransactionStatus.FAILED) {
        throw new Error(`Transaction failed on-chain: ${hash}`);
      }
    }
    throw new Error(`Transaction not confirmed after polling: ${hash}`);
  }

  // ── View methods ───────────────────────────────────────────────────────────

  async getStats(): Promise<CampaignStats> {
    const raw = await this.view<{
      total_raised: bigint; goal: bigint; progress_bps: number;
      contributor_count: number; average_contribution: bigint; largest_contribution: bigint;
    }>("get_stats");
    return {
      raisedXlm:              stroopsToXlm(raw.total_raised),
      goalXlm:                stroopsToXlm(raw.goal),
      progressPercent:        raw.progress_bps / 100,
      contributorCount:       raw.contributor_count,
      avgContributionXlm:     stroopsToXlm(raw.average_contribution),
      largestContributionXlm: stroopsToXlm(raw.largest_contribution),
      raisedStroops:          raw.total_raised,
      goalStroops:            raw.goal,
    };
  }

  async getCampaignInfo(): Promise<CampaignInfo> {
    const raw = await this.view<Record<string, unknown>>("get_campaign_info");
    return {
      creator:                raw.creator as string,
      token:                  raw.token as string,
      goalXlm:                stroopsToXlm(raw.goal as bigint),
      goalStroops:            raw.goal as bigint,
      deadline:               new Date(Number(raw.deadline as bigint) * 1000),
      minContributionXlm:     stroopsToXlm(raw.min_contribution as bigint),
      minContributionStroops: raw.min_contribution as bigint,
      maxContributionXlm:     stroopsToXlm(raw.max_contribution as bigint),
      maxContributionStroops: raw.max_contribution as bigint,
      title:                  raw.title as string,
      description:            raw.description as string,
      status:                 raw.status as CampaignInfo["status"],
      category:               raw.category as CampaignInfo["category"],
      hasPlatformConfig:      raw.has_platform_config as boolean,
      platformFeeBps:         raw.platform_fee_bps as number,
    };
  }

  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    const raw = await this.view<Record<string, unknown>>("get_performance_metrics");
    return {
      successRateBps:           raw.success_rate_bps as number,
      contributionVelocityXlm:  stroopsToXlm(raw.contribution_velocity as bigint),
      trending:                 raw.trending as number,
      milestonesReached:        raw.milestones_reached as number,
      totalMilestones:          raw.total_milestones as number,
      timeElapsedSeconds:       Number(raw.time_elapsed as bigint),
      estimatedSecondsToGoal:   Number(raw.estimated_time_to_goal as bigint),
      avgDailyContributionXlm:  stroopsToXlm(raw.average_daily_contribution as bigint),
    };
  }

  async getContribution(address: string): Promise<number> {
    const stroops = await this.view<bigint>("contribution", [new Address(address).toScVal()]);
    return stroopsToXlm(stroops);
  }

  async getContributionHistory(address: string): Promise<ContributionRecord[]> {
    const raw = await this.view<Array<{ amount: bigint; timestamp: bigint; running_total: bigint }>>(
      "get_contribution_history",
      [new Address(address).toScVal()],
    );
    return raw.map((r) => ({
      amountXlm:        stroopsToXlm(r.amount),
      timestamp:        new Date(Number(r.timestamp) * 1000),
      runningTotalXlm:  stroopsToXlm(r.running_total),
    }));
  }

  async isContributor(address: string): Promise<boolean> {
    return this.view<boolean>("is_contributor", [new Address(address).toScVal()]);
  }

  async listContributors(opts: ListContributorsOptions): Promise<string[]> {
    return this.view<string[]>("contributor_list", [
      nativeToScVal(opts.offset, { type: "u32" }),
      nativeToScVal(opts.limit,  { type: "u32" }),
    ]);
  }

  async getMatchingConfig(): Promise<MatchingConfig | null> {
    const raw = await this.view<Record<string, unknown> | null>("get_matching_config");
    if (!raw) return null;
    return {
      sponsor:       raw.sponsor as string,
      matchRatioBps: raw.match_ratio as number,
      maxMatchXlm:   stroopsToXlm(raw.max_match as bigint),
      maxMatchStroops: raw.max_match as bigint,
    };
  }

  async getTotalMatched(): Promise<number> {
    const stroops = await this.view<bigint>("get_total_matched");
    return stroopsToXlm(stroops);
  }

  async getMatchingPool(): Promise<number> {
    const stroops = await this.view<bigint>("get_matching_pool");
    return stroopsToXlm(stroops);
  }

  // ── Write methods ──────────────────────────────────────────────────────────

  async contribute(opts: ContributeOptions): Promise<string> {
    return this.invoke(opts.contributor, "contribute", [
      new Address(opts.contributor).toScVal(),
      nativeToScVal(xlmToStroops(opts.amountXlm), { type: "i128" }),
      new Address(opts.tokenId).toScVal(),
      opts.message
        ? nativeToScVal(opts.message, { type: "string" })
        : { switch: () => "scvVoid" } as unknown as ReturnType<typeof nativeToScVal>,
    ], opts.signTx);
  }

  async withdraw(opts: WithdrawOptions): Promise<string> {
    return this.invoke(opts.creator, "withdraw", [], opts.signTx);
  }

  async refundSingle(opts: RefundOptions): Promise<string> {
    return this.invoke(opts.contributor, "refund_single", [
      new Address(opts.contributor).toScVal(),
    ], opts.signTx);
  }

  async cancelCampaign(opts: CancelOptions): Promise<string> {
    return this.invoke(opts.creator, "cancel_campaign", [], opts.signTx);
  }

  async setupMatching(opts: SetupMatchingOptions): Promise<string> {
    return this.invoke(opts.sponsorAddress, "setup_matching", [
      new Address(opts.sponsorAddress).toScVal(),
      nativeToScVal(opts.matchRatioBps,                  { type: "u32"  }),
      nativeToScVal(xlmToStroops(opts.maxMatchXlm), { type: "i128" }),
    ], opts.signTx);
  }

  async refundMatchingSponsor(opts: RefundMatchingSponsorOptions): Promise<string> {
    return this.invoke(opts.creatorAddress, "refund_matching_sponsor", [], opts.signTx);
  }

  /** Unused — STROOPS constant exported for consumers. */
  static readonly STROOPS_PER_XLM = STROOPS;
}
