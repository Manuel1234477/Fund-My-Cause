"use client";

import React, { useState } from "react";
import { use } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { useWallet } from "@/hooks/useWallet";
import { readProfile, writeProfile } from "@/lib/profileStore";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { StatsBar } from "@/components/profile/StatsBar";
import { CampaignsSection } from "@/components/profile/CampaignsSection";
import { ContributionsSection } from "@/components/profile/ContributionsSection";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import { useContributions } from "@/hooks/useContributions";
import { useProfileStats } from "@/hooks/useProfileStats";
import type { ProfileData } from "@/types/profile";
import type { CampaignData } from "@/lib/soroban";
import { BreadcrumbProvider } from "@/context/BreadcrumbContext";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

/** Validates a Stellar G... public key format (basic check) */
function isValidStellarAddress(addr: string): boolean {
  return typeof addr === "string" && /^G[A-Z2-7]{55}$/.test(addr);
}

export default function ProfilePage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address: walletAddress } = useWallet();
  const { address } = use(params);

  // Profile metadata state
  const [profile, setProfile] = useState<ProfileData>(() => {
    // Only read from localStorage on the client after hydration
    if (typeof window === "undefined") {
      return { avatarUri: "", bio: "", socialLinks: [] };
    }
    return readProfile(address);
  });

  const [editOpen, setEditOpen] = useState(false);

  // Contribution data for stats
  const { contributions, loading: contribLoading } = useContributions(address);

  // Stats (campaigns fetched inside CampaignsSection; we use a lightweight version here)
  const [creatorCampaigns, setCreatorCampaigns] = useState<CampaignData[]>([]);
  const stats = useProfileStats(creatorCampaigns, contributions);

  const isOwner = !!walletAddress && walletAddress === address;

  // Validate address format
  if (!isValidStellarAddress(address)) {
    return (
      <BreadcrumbProvider>
        <main className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">
          <Navbar />
          <div className="max-w-2xl mx-auto px-6 py-16 text-center">
            <p className="text-red-500 text-lg font-semibold">
              Invalid Stellar address format.
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Profile addresses must be a valid Stellar public key (G…).
            </p>
          </div>
        </main>
      </BreadcrumbProvider>
    );
  }

  const handleSave = (updated: ProfileData) => {
    writeProfile(address, updated);
    setProfile(updated);
    setEditOpen(false);
  };

  return (
    <BreadcrumbProvider>
      <main className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 py-12 space-y-10">
          <Breadcrumb
            crumbs={[{ label: "Profile" }]}
            className="text-gray-500"
          />

          {/* Profile header */}
          <ProfileHeader
            address={address}
            profile={profile}
            isOwner={isOwner}
            onEdit={() => setEditOpen(true)}
          />

          {/* Stats bar */}
          <StatsBar
            campaignCount={stats.campaignCount}
            totalRaised={stats.totalRaised}
            contributionCount={stats.contributionCount}
            totalContributed={stats.totalContributed}
            loading={contribLoading}
          />

          {/* Campaigns created */}
          <CampaignsSection
            address={address}
            onCampaignsLoaded={setCreatorCampaigns}
          />

          {/* Contribution history */}
          <ContributionsSection address={address} />
        </div>

        {/* Edit modal */}
        {editOpen && (
          <EditProfileModal
            address={address}
            current={profile}
            onSave={handleSave}
            onClose={() => setEditOpen(false)}
          />
        )}
      </main>
    </BreadcrumbProvider>
  );
}
