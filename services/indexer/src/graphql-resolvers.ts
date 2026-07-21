import { GraphQLObjectType, GraphQLSchema, GraphQLString, GraphQLInt, GraphQLField, GraphQLList, GraphQLBoolean, GraphQLEnumType, GraphQLScalarType, GraphQLNonNull } from 'graphql';
import DataLoader from 'dataloader';
import { createLogger } from './logger.js';

const logger = createLogger('graphql-resolvers');

const BigIntScalar = new GraphQLScalarType({
  name: 'BigInt',
  serialize: (value: unknown) => String(value),
  parseValue: (value: unknown) => BigInt(String(value)),
  parseLiteral: (ast: any) => BigInt(ast.value)
});

const CampaignStatusEnum = new GraphQLEnumType({
  name: 'CampaignStatus',
  values: {
    ACTIVE: { value: 'active' },
    SUCCEEDED: { value: 'succeeded' },
    FAILED: { value: 'failed' }
  }
});

const PageInfoType = new GraphQLObjectType({
  name: 'PageInfo',
  fields: () => ({
    endCursor: { type: GraphQLString },
    hasNextPage: { type: new GraphQLNonNull(GraphQLBoolean) }
  })
});

const ContributionType: GraphQLObjectType = new GraphQLObjectType({
  name: 'Contribution',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLString) },
    contributorAddress: { type: new GraphQLNonNull(GraphQLString) },
    amount: { type: new GraphQLNonNull(BigIntScalar) },
    tokenAmount: { type: new GraphQLNonNull(BigIntScalar) },
    contributedAt: { type: new GraphQLNonNull(GraphQLString) },
    txHash: { type: GraphQLString }
  })
});

const ContributionEdgeType = new GraphQLObjectType({
  name: 'ContributionEdge',
  fields: () => ({
    cursor: { type: new GraphQLNonNull(GraphQLString) },
    node: { type: new GraphQLNonNull(ContributionType) }
  })
});

const ContributionConnectionType = new GraphQLObjectType({
  name: 'ContributionConnection',
  fields: () => ({
    edges: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(ContributionEdgeType))) },
    pageInfo: { type: new GraphQLNonNull(PageInfoType) },
    totalCount: { type: new GraphQLNonNull(GraphQLInt) }
  })
});

const CampaignType: GraphQLObjectType = new GraphQLObjectType({
  name: 'Campaign',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLString) },
    creatorAddress: { type: new GraphQLNonNull(GraphQLString) },
    contractAddress: { type: new GraphQLNonNull(GraphQLString) },
    tokenAddress: { type: new GraphQLNonNull(GraphQLString) },
    title: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: GraphQLString },
    goal: { type: new GraphQLNonNull(BigIntScalar) },
    totalRaised: { type: new GraphQLNonNull(BigIntScalar) },
    status: { type: new GraphQLNonNull(CampaignStatusEnum) },
    deadline: { type: new GraphQLNonNull(GraphQLInt) },
    minContribution: { type: new GraphQLNonNull(BigIntScalar) },
    contributorCount: { type: new GraphQLNonNull(GraphQLInt) },
    progress: {
      type: GraphQLInt,
      resolve: (campaign: any) => {
        if (campaign.goal === '0') return 0;
        return Math.round((parseInt(campaign.total_raised) / parseInt(campaign.goal)) * 10000);
      }
    },
    contributions: {
      type: new GraphQLNonNull(ContributionConnectionType),
      args: {
        first: { type: GraphQLInt },
        after: { type: GraphQLString }
      },
      resolve: async (campaign: any, { first, after }, context) => {
        const limit = Math.min(first || 20, 100);
        const offset = after ? parseInt(Buffer.from(after, 'base64').toString()) : 0;

        const result = await context.pool.query(
          `SELECT id, contributor_address, amount, token_amount, contributed_at, tx_hash
           FROM contributions
           WHERE campaign_id = $1
           ORDER BY contributed_at DESC
           LIMIT $2 OFFSET $3`,
          [campaign.id, limit, offset]
        );

        const edges = result.rows.map((row: any, idx: number) => ({
          cursor: Buffer.from(String(offset + idx)).toString('base64'),
          node: {
            id: row.id,
            contributorAddress: row.contributor_address,
            amount: row.amount,
            tokenAmount: row.token_amount,
            contributedAt: row.contributed_at.toISOString(),
            txHash: row.tx_hash
          }
        }));

        return {
          edges,
          pageInfo: {
            endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
            hasNextPage: result.rows.length === limit
          },
          totalCount: result.rows.length
        };
      }
    },
    createdAt: { type: new GraphQLNonNull(GraphQLString) },
    updatedAt: { type: new GraphQLNonNull(GraphQLString) }
  })
});

const CampaignEdgeType = new GraphQLObjectType({
  name: 'CampaignEdge',
  fields: () => ({
    cursor: { type: new GraphQLNonNull(GraphQLString) },
    node: { type: new GraphQLNonNull(CampaignType) }
  })
});

const CampaignConnectionType = new GraphQLObjectType({
  name: 'CampaignConnection',
  fields: () => ({
    edges: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(CampaignEdgeType))) },
    pageInfo: { type: new GraphQLNonNull(PageInfoType) },
    totalCount: { type: new GraphQLNonNull(GraphQLInt) }
  })
});

const StatsType = new GraphQLObjectType({
  name: 'Stats',
  fields: () => ({
    totalCampaigns: { type: new GraphQLNonNull(GraphQLInt) },
    activeCampaigns: { type: new GraphQLNonNull(GraphQLInt) },
    succeededCampaigns: { type: new GraphQLNonNull(GraphQLInt) },
    totalRaised: { type: new GraphQLNonNull(BigIntScalar) },
    totalContributors: { type: new GraphQLNonNull(GraphQLInt) },
    avgRaisedPerCampaign: { type: GraphQLInt }
  })
});

const QueryType = new GraphQLObjectType({
  name: 'Query',
  fields: () => ({
    campaign: {
      type: CampaignType,
      args: { id: { type: new GraphQLNonNull(GraphQLString) } },
      resolve: async (_, { id }, context) => {
        const result = await context.pool.query(
          `SELECT * FROM campaigns WHERE id = $1 OR contract_address = $1`,
          [id]
        );
        return result.rows[0] || null;
      }
    },
    campaigns: {
      type: new GraphQLNonNull(CampaignConnectionType),
      args: {
        first: { type: GraphQLInt },
        after: { type: GraphQLString },
        status: { type: CampaignStatusEnum }
      },
      resolve: async (_, { first, after, status }, context) => {
        const limit = Math.min(first || 20, 100);
        const offset = after ? parseInt(Buffer.from(after, 'base64').toString()) : 0;

        let query = 'SELECT * FROM campaigns WHERE 1=1';
        const values: any[] = [];

        if (status) {
          values.push(status);
          query += ` AND status = $${values.length}`;
        }

        query += ' ORDER BY created_at DESC LIMIT $' + (values.length + 1) + ' OFFSET $' + (values.length + 2);
        values.push(limit, offset);

        const result = await context.pool.query(query, values);

        const edges = result.rows.map((row: any, idx: number) => ({
          cursor: Buffer.from(String(offset + idx)).toString('base64'),
          node: row
        }));

        return {
          edges,
          pageInfo: {
            endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
            hasNextPage: result.rows.length === limit
          },
          totalCount: result.rows.length
        };
      }
    },
    stats: {
      type: new GraphQLNonNull(StatsType),
      resolve: async (_, __, context) => {
        const result = await context.pool.query(`
          SELECT 
            COUNT(DISTINCT id) as total_campaigns,
            COUNT(DISTINCT CASE WHEN status = 'active' THEN id END) as active_campaigns,
            COUNT(DISTINCT CASE WHEN status = 'succeeded' THEN id END) as succeeded_campaigns,
            COALESCE(SUM(total_raised), 0) as total_raised,
            COALESCE(SUM(contributor_count), 0) as total_contributors,
            COALESCE(AVG(total_raised::numeric), 0) as avg_raised_per_campaign
          FROM campaigns
        `);
        return result.rows[0];
      }
    }
  })
});

export const schema = new GraphQLSchema({
  query: QueryType
});
