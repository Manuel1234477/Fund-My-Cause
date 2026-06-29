"use client";

import { useEffect, useRef } from "react";
import { useSubscription, type OperationVariables } from "@apollo/client";
import type { DocumentNode } from "graphql";

/**
 * Custom hook for managing GraphQL subscriptions.
 * Uses a stable callback ref so the subscription does not re-fire when the
 * caller provides a new function reference on every render.
 */
export function useGraphQLSubscription<
  TData = unknown,
  TVariables extends OperationVariables = OperationVariables,
>(
  subscription: DocumentNode,
  options?: {
    variables?: TVariables;
    onData?: (data: TData) => void;
    onError?: (error: Error) => void;
    skip?: boolean;
  },
) {
  const onDataRef = useRef(options?.onData);
  const onErrorRef = useRef(options?.onError);

  // Keep refs up-to-date without adding them to effect deps
  useEffect(() => {
    onDataRef.current = options?.onData;
  });
  useEffect(() => {
    onErrorRef.current = options?.onError;
  });

  const { data, loading, error } = useSubscription<TData, TVariables>(
    subscription,
    { variables: options?.variables, skip: options?.skip },
  );

  useEffect(() => {
    if (data) onDataRef.current?.(data);
  }, [data]);

  useEffect(() => {
    if (error) onErrorRef.current?.(error);
  }, [error]);

  return { data, loading, error };
}

/**
 * Hook for subscribing to campaign updates.
 * The `callback` is stored in a ref so a new function reference from the
 * caller does not cause the subscription to remount.
 */
export function useCampaignUpdates(
  campaignId: string | null,
  callback?: (update: unknown) => void,
) {
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  });

  const { data, loading, error } = useSubscription(
    require("../graphql/queries.js").ON_CAMPAIGN_UPDATED,
    { variables: { id: campaignId }, skip: !campaignId },
  );

  useEffect(() => {
    if (data?.campaignUpdated) callbackRef.current?.(data.campaignUpdated);
  }, [data]);

  return { update: data?.campaignUpdated, loading, error };
}

/**
 * Hook for subscribing to campaign status changes.
 */
export function useCampaignStatusSubscription(
  campaignId: string | null,
  callback?: (campaign: unknown) => void,
) {
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  });

  const { data, loading, error } = useSubscription(
    require("../graphql/queries.js").ON_CAMPAIGN_STATUS_CHANGED,
    { variables: { id: campaignId }, skip: !campaignId },
  );

  useEffect(() => {
    if (data?.campaignStatusChanged)
      callbackRef.current?.(data.campaignStatusChanged);
  }, [data]);

  return { campaign: data?.campaignStatusChanged, loading, error };
}

/**
 * Hook for subscribing to new contributions.
 */
export function useNewContributions(
  campaignId: string | null,
  callback?: (contribution: unknown) => void,
) {
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  });

  const { data, loading, error } = useSubscription(
    require("../graphql/queries.js").ON_NEW_CONTRIBUTION,
    { variables: { campaignId }, skip: !campaignId },
  );

  useEffect(() => {
    if (data?.newContribution) callbackRef.current?.(data.newContribution);
  }, [data]);

  return { contribution: data?.newContribution, loading, error };
}

/**
 * Hook for subscribing to campaign progress changes.
 */
export function useCampaignProgressSubscription(
  campaignId: string | null,
  callback?: (progress: unknown) => void,
) {
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  });

  const { data, loading, error } = useSubscription(
    require("../graphql/queries.js").ON_CAMPAIGN_PROGRESS_CHANGED,
    { variables: { id: campaignId }, skip: !campaignId },
  );

  useEffect(() => {
    if (data?.campaignProgressChanged)
      callbackRef.current?.(data.campaignProgressChanged);
  }, [data]);

  return { progress: data?.campaignProgressChanged, loading, error };
}

/**
 * Hook for subscribing to milestone events.
 */
export function useMilestoneSubscription(
  campaignId: string | null,
  callback?: (milestone: unknown) => void,
) {
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  });

  const { data, loading, error } = useSubscription(
    require("../graphql/queries.js").ON_MILESTONE_REACHED,
    { variables: { campaignId }, skip: !campaignId },
  );

  useEffect(() => {
    if (data?.milestoneReached) callbackRef.current?.(data.milestoneReached);
  }, [data]);

  return { milestone: data?.milestoneReached, loading, error };
}

/**
 * Hook for managing multiple subscriptions.
 * Each subscription's `onData` is held in a ref to prevent the effect from
 * re-running when only the callback reference changes.
 */
export function useMultipleSubscriptions(
  subscriptions: Array<{
    subscription: DocumentNode;
    variables?: OperationVariables;
    onData?: (data: unknown) => void;
    skip?: boolean;
  }>,
) {
  // Keep stable refs for all callbacks
  const callbackRefs = useRef(subscriptions.map((s) => s.onData));
  useEffect(() => {
    callbackRefs.current = subscriptions.map((s) => s.onData);
  });

  const results = subscriptions.map((sub) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useSubscription(sub.subscription, {
      variables: sub.variables,
      skip: sub.skip,
    }),
  );

  useEffect(() => {
    results.forEach((result, index) => {
      if (result.data) callbackRefs.current[index]?.(result.data);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results.map((r) => r.data)]);

  return results.map((result) => ({
    loading: result.loading,
    error: result.error,
    data: result.data,
  }));
}
