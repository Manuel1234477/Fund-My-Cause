"use client";

import { useEffect, useMemo, useState } from "react";
import { CampaignData } from "@/types/soroban";
import { createAnalyticsWebSocket, fetchAnalyticsSnapshot, RealtimeAnalyticsPayload } from "@/services/analytics.service";

export function useRealTimeAnalytics(campaigns: CampaignData[]) {
  const [realtimeCampaigns, setRealtimeCampaigns] = useState<CampaignData[]>(campaigns);
  const [connected, setConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  const [error, setError] = useState<string | null>(null);

  const campaignIds = useMemo(
    () => campaigns.map((campaign) => campaign.contractId),
    [campaigns]
  );

  useEffect(() => {
    setRealtimeCampaigns(campaigns);
  }, [campaigns]);

  useEffect(() => {
    if (typeof window === "undefined" || campaignIds.length === 0) {
      return;
    }

    let disconnected = false;
    const socket = createAnalyticsWebSocket(
      campaignIds,
      (payload: RealtimeAnalyticsPayload) => {
        if (disconnected) return;
        setRealtimeCampaigns(payload.campaigns);
        setLastUpdated(payload.timestamp);
        setError(null);
      },
      () => {
        if (disconnected) return;
        setConnected(true);
      },
      () => {
        if (disconnected) return;
        setConnected(false);
        setError("Live analytics unavailable. Showing latest cached snapshot.");
      }
    );

    void fetchAnalyticsSnapshot(campaignIds)
      .then((snapshot) => {
        if (disconnected) return;
        if (snapshot.campaigns.length > 0) {
          setRealtimeCampaigns(snapshot.campaigns);
          setLastUpdated(snapshot.timestamp);
        }
      })
      .catch(() => {
        if (disconnected) return;
        setError("Unable to refresh analytics snapshot.");
      });

    return () => {
      disconnected = true;
      socket.disconnect();
    };
  }, [campaignIds.join(",")]);

  return {
    analytics: realtimeCampaigns,
    connected,
    error,
    lastUpdated,
  };
}
