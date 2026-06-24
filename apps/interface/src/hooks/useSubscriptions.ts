import { useEffect } from "react";
import { useSubscription, type OperationVariables, type ApolloQueryResult } from "@apollo/client";
import type { DocumentNode } from "graphql";

/**
 * Custom hook for managing GraphQL subscriptions
 */
export function useGraphQLSubscription<TData = any, TVariables extends OperationVariables = OperationVariables>(
  subscription: DocumentNode,
  options?: {
    variables?: TVariables;
    onData?: (data: TData) => void;
    onError?: (error: Error) => void;
    onComplete?: () => void;
    skip?: boolean;
  }
) {
  const { data, loading, error } = useSubscription<TData, TVariables>(subscription, {
    variables: options?.variables,
    skip: options?.skip,
  });

  useEffect(() => {
    if (data && options?.onData) {
      options.onData(data);
    }
  }, [data, options]);

  useEffect(() => {
    if (error && options?.onError) {
      options.onError(error);
    }
  }, [error, options]);

  return { data, loading, error };
}

/**
 * Hook for subscribing to campaign updates
 */
export function useCampaignUpdates(campaignId: string | null, callback?: (update: any) => void) {
  const { data, loading, error } = useSubscription(
    require("../graphql/queries.js").ON_CAMPAIGN_UPDATED,
    {
      variables: { id: campaignId },
      skip: !campaignId,
    }
  );

  useEffect(() => {
    if (data?.campaignUpdated && callback) {
      callback(data.campaignUpdated);
    }
  }, [data, callback]);

  return { update: data?.campaignUpdated, loading, error };
}

/**
 * Hook for subscribing to campaign status changes
 */
export function useCampaignStatusSubscription(campaignId: string | null, callback?: (campaign: any) => void) {
  const { data, loading, error } = useSubscription(
    require("../graphql/queries.js").ON_CAMPAIGN_STATUS_CHANGED,
    {
      variables: { id: campaignId },
      skip: !campaignId,
    }
  );

  useEffect(() => {
    if (data?.campaignStatusChanged && callback) {
      callback(data.campaignStatusChanged);
    }
  }, [data, callback]);

  return { campaign: data?.campaignStatusChanged, loading, error };
}

/**
 * Hook for subscribing to new contributions
 */
export function useNewContributions(campaignId: string | null, callback?: (contribution: any) => void) {
  const { data, loading, error } = useSubscription(
    require("../graphql/queries.js").ON_NEW_CONTRIBUTION,
    {
      variables: { campaignId },
      skip: !campaignId,
    }
  );

  useEffect(() => {
    if (data?.newContribution && callback) {
      callback(data.newContribution);
    }
  }, [data, callback]);

  return { contribution: data?.newContribution, loading, error };
}

/**
 * Hook for subscribing to campaign progress changes
 */
export function useCampaignProgressSubscription(campaignId: string | null, callback?: (progress: any) => void) {
  const { data, loading, error } = useSubscription(
    require("../graphql/queries.js").ON_CAMPAIGN_PROGRESS_CHANGED,
    {
      variables: { id: campaignId },
      skip: !campaignId,
    }
  );

  useEffect(() => {
    if (data?.campaignProgressChanged && callback) {
      callback(data.campaignProgressChanged);
    }
  }, [data, callback]);

  return { progress: data?.campaignProgressChanged, loading, error };
}

/**
 * Hook for subscribing to milestone events
 */
export function useMilestoneSubscription(campaignId: string | null, callback?: (milestone: any) => void) {
  const { data, loading, error } = useSubscription(
    require("../graphql/queries.js").ON_MILESTONE_REACHED,
    {
      variables: { campaignId },
      skip: !campaignId,
    }
  );

  useEffect(() => {
    if (data?.milestoneReached && callback) {
      callback(data.milestoneReached);
    }
  }, [data, callback]);

  return { milestone: data?.milestoneReached, loading, error };
}

/**
 * Hook for managing multiple subscriptions
 */
export function useMultipleSubscriptions(subscriptions: Array<{
  subscription: DocumentNode;
  variables?: OperationVariables;
  onData?: (data: any) => void;
  skip?: boolean;
}>) {
  const results = subscriptions.map((sub) =>
    useSubscription(sub.subscription, {
      variables: sub.variables,
      skip: sub.skip,
    })
  );

  useEffect(() => {
    results.forEach((result, index) => {
      if (result.data && subscriptions[index].onData) {
        subscriptions[index].onData?.(result.data);
      }
    });
  }, [results, subscriptions]);

  return results.map((result) => ({
    loading: result.loading,
    error: result.error,
    data: result.data,
  }));
}
