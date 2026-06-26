import { gql } from "@apollo/client";

/**
 * Campaign Queries
 */
export const GET_CAMPAIGN = gql`
  query GetCampaign($id: ID!) {
    campaign(id: $id) {
      id
      contractId
      title
      description
      creator
      goal
      raised
      deadline
      status
      category
      image
      videoUrl
      minContribution
      totalContributors
      percentageFunded
      daysRemaining
      token
      platformFeeBps
      hasRBACEnabled
      createdAt
      updatedAt
    }
  }
`;

export const GET_CAMPAIGNS = gql`
  query GetCampaigns(
    $filter: CampaignFilter
    $pagination: PaginationInput
    $sort: CampaignSort
  ) {
    campaigns(filter: $filter, pagination: $pagination, sort: $sort) {
      edges {
        node {
          id
          title
          description
          creator
          goal
          raised
          deadline
          status
          category
          image
          percentageFunded
          daysRemaining
          totalContributors
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
`;

export const GET_ACTIVE_CAMPAIGNS = gql`
  query GetActiveCampaigns($limit: Int) {
    activeCampaigns(limit: $limit) {
      id
      title
      description
      goal
      raised
      deadline
      status
      category
      image
      percentageFunded
      daysRemaining
      totalContributors
    }
  }
`;

export const GET_TRENDING_CAMPAIGNS = gql`
  query GetTrendingCampaigns($limit: Int) {
    trendingCampaigns(limit: $limit) {
      id
      title
      description
      goal
      raised
      deadline
      status
      category
      image
      percentageFunded
      daysRemaining
      totalContributors
    }
  }
`;

export const SEARCH_CAMPAIGNS = gql`
  query SearchCampaigns($query: String!, $limit: Int) {
    searchCampaigns(query: $query, limit: $limit) {
      id
      title
      description
      goal
      raised
      deadline
      status
      category
      image
      percentageFunded
      daysRemaining
      totalContributors
    }
  }
`;

export const GET_CAMPAIGN_DETAIL = gql`
  query GetCampaignDetail($id: ID!) {
    campaignDetail(id: $id) {
      campaign {
        id
        contractId
        title
        description
        creator
        goal
        raised
        deadline
        status
        category
        image
        videoUrl
        minContribution
        totalContributors
        percentageFunded
        daysRemaining
        token
        platformFeeBps
        hasRBACEnabled
        createdAt
        updatedAt
      }
      contributors {
        address
        amount
        contributionCount
        isTopContributor
      }
      topContributors(limit: 10) {
        rank
        address
        amount
        percentage
      }
      updates {
        id
        campaignId
        content
        ipfsHash
        timestamp
      }
      milestones {
        id
        campaignId
        title
        description
        targetAmount
        releasePercentage
        status
      }
    }
  }
`;

/**
 * Contribution Queries
 */
export const GET_CONTRIBUTION = gql`
  query GetContribution($id: ID!) {
    contribution(id: $id) {
      id
      campaignId
      contributor
      amount
      timestamp
      transactionHash
    }
  }
`;

export const GET_CONTRIBUTIONS = gql`
  query GetContributions($campaignId: ID, $contributor: String) {
    contributions(campaignId: $campaignId, contributor: $contributor) {
      id
      campaignId
      contributor
      amount
      timestamp
      transactionHash
    }
  }
`;

export const GET_CAMPAIGN_CONTRIBUTIONS = gql`
  query GetCampaignContributions($campaignId: ID!) {
    contributions(campaignId: $campaignId) {
      id
      campaignId
      contributor
      amount
      timestamp
      transactionHash
    }
  }
`;

/**
 * User Queries
 */
export const GET_USER = gql`
  query GetUser($address: String!) {
    user(address: $address) {
      address
      totalContributed
      contributionCount
      campaigns {
        id
        title
        status
        goal
        raised
        totalContributors
      }
      contributions {
        id
        campaignId
        amount
        timestamp
      }
      joinedAt
    }
  }
`;

export const GET_USER_CONTRIBUTIONS = gql`
  query GetUserContributions($address: String!, $limit: Int) {
    userContributions(address: $address, limit: $limit) {
      id
      campaignId
      contributor
      amount
      timestamp
      transactionHash
    }
  }
`;

/**
 * Statistics Queries
 */
export const GET_STATS = gql`
  query GetStats {
    stats {
      totalCampaigns
      activeCampaigns
      totalRaised
      totalContributors
      averageContribution
      successRate
    }
  }
`;

/**
 * Authentication Mutations
 */
export const AUTHENTICATE = gql`
  mutation Authenticate($signature: String!, $message: String!, $address: String!) {
    authenticate(signature: $signature, message: $message, address: $address) {
      token
      user {
        address
        totalContributed
        contributionCount
        joinedAt
      }
    }
  }
`;

/**
 * Campaign Mutations
 */
export const CREATE_CAMPAIGN = gql`
  mutation CreateCampaign($input: CreateCampaignInput!) {
    createCampaign(input: $input) {
      id
      contractId
      title
      description
      creator
      goal
      raised
      deadline
      status
      category
      image
      videoUrl
      minContribution
      totalContributors
      token
      hasRBACEnabled
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_CAMPAIGN = gql`
  mutation UpdateCampaign($id: ID!, $input: UpdateCampaignInput!) {
    updateCampaign(id: $id, input: $input) {
      id
      title
      description
      image
      videoUrl
      updatedAt
    }
  }
`;

/**
 * Contribution Mutations
 */
export const RECORD_CONTRIBUTION = gql`
  mutation RecordContribution($input: RecordContributionInput!) {
    recordContribution(input: $input) {
      id
      campaignId
      contributor
      amount
      timestamp
      transactionHash
    }
  }
`;

/**
 * Campaign Subscriptions
 */
export const ON_CAMPAIGN_UPDATED = gql`
  subscription OnCampaignUpdated($id: ID!) {
    campaignUpdated(id: $id) {
      id
      campaignId
      content
      ipfsHash
      timestamp
    }
  }
`;

export const ON_CAMPAIGN_STATUS_CHANGED = gql`
  subscription OnCampaignStatusChanged($id: ID!) {
    campaignStatusChanged(id: $id) {
      id
      status
      updatedAt
    }
  }
`;

export const ON_NEW_CONTRIBUTION = gql`
  subscription OnNewContribution($campaignId: ID!) {
    newContribution(campaignId: $campaignId) {
      id
      campaignId
      contributor
      amount
      timestamp
      transactionHash
    }
  }
`;

export const ON_CAMPAIGN_PROGRESS_CHANGED = gql`
  subscription OnCampaignProgressChanged($id: ID!) {
    campaignProgressChanged(id: $id) {
      campaignId
      raised
      percentageFunded
      contributors
      daysRemaining
      timestamp
    }
  }
`;

export const ON_MILESTONE_REACHED = gql`
  subscription OnMilestoneReached($campaignId: ID!) {
    milestoneReached(campaignId: $campaignId) {
      id
      campaignId
      title
      description
      targetAmount
      releasePercentage
      status
    }
  }
`;
