export { FmcClient }           from "./client";
export { FmcRegistryClient }   from "./registry";
export { FmcContractError, parseAndThrow } from "./errors";
export { xlmToStroops, stroopsToXlm, bpsToPercent, unixToDate, daysUntil, STROOPS_PER_XLM } from "./utils";
export type {
  FmcClientConfig,
  RegistryClientConfig,
  SignFn,
  CampaignStatus,
  Category,
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
  ListOptions,
  ListByCategoryOptions,
} from "./types";
