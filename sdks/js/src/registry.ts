import {
  rpc as SorobanRpc,
  Contract,
  TransactionBuilder,
  BASE_FEE,
  scValToNative,
  nativeToScVal,
} from "@stellar/stellar-sdk";
import type { RegistryClientConfig, ListOptions, ListByCategoryOptions } from "./types";
import { parseAndThrow } from "./errors";

export class FmcRegistryClient {
  private readonly rpc: SorobanRpc.Server;
  private readonly contract: Contract;
  private readonly networkPassphrase: string;

  constructor(config: RegistryClientConfig) {
    this.rpc               = new SorobanRpc.Server(config.rpcUrl);
    this.contract          = new Contract(config.contractId);
    this.networkPassphrase = config.networkPassphrase;
  }

  private async view<T>(method: string, args: ReturnType<typeof nativeToScVal>[]): Promise<T> {
    const DUMMY = "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN";
    const account = { accountId: () => DUMMY, sequenceNumber: () => "0", incrementSequenceNumber: () => {} } as unknown as ConstructorParameters<typeof TransactionBuilder>[0];

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(this.contract.call(method, ...args))
      .setTimeout(30)
      .build();

    const result = await this.rpc.simulateTransaction(tx);
    if (SorobanRpc.Api.isSimulationError(result)) parseAndThrow(result.error);
    return scValToNative((result as SorobanRpc.Api.SimulateTransactionSuccessResponse).result!.retval) as T;
  }

  /** Paginated list of all registered campaign contract addresses. */
  async list(opts: ListOptions): Promise<string[]> {
    return this.view<string[]>("list", [
      nativeToScVal(opts.offset, { type: "u32" }),
      nativeToScVal(opts.limit,  { type: "u32" }),
    ]);
  }

  /** Paginated campaigns filtered by category. */
  async getByCampaignCategory(opts: ListByCategoryOptions): Promise<string[]> {
    return this.view<string[]>("get_campaigns_by_category", [
      nativeToScVal(opts.categoryId, { type: "u32" }),
      nativeToScVal(opts.offset,     { type: "u32" }),
      nativeToScVal(opts.limit,      { type: "u32" }),
    ]);
  }

  /** Fetch all registered campaign addresses (handles pagination automatically). */
  async listAll(pageSize = 50): Promise<string[]> {
    const all: string[] = [];
    let offset = 0;
    while (true) {
      const page = await this.list({ offset, limit: pageSize });
      all.push(...page);
      if (page.length < pageSize) break;
      offset += pageSize;
    }
    return all;
  }
}
