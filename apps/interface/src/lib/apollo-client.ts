import { ApolloClient, InMemoryCache, HttpLink, split, ApolloLink } from "@apollo/client";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { getMainDefinition } from "@apollo/client/utilities";
import { createClient } from "graphql-ws";
import type { NormalizedCacheObject } from "@apollo/client";

/**
 * Get the GraphQL API endpoint
 */
function getGraphQLEndpoint(): string {
  // Use environment variable if available
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || "http://localhost:4000/graphql";
  }

  // In browser
  const isDevelopment = process.env.NODE_ENV === "development";
  const protocol = window.location.protocol === "https:" ? "https" : "http";
  const host = window.location.host;

  return (
    process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ||
    (isDevelopment ? "http://localhost:4000/graphql" : `${protocol}//${host}/graphql`)
  );
}

/**
 * Get the WebSocket endpoint
 */
function getWebSocketEndpoint(): string {
  const endpoint = getGraphQLEndpoint();
  const isDevelopment = process.env.NODE_ENV === "development";
  const protocol = typeof window !== "undefined" && window.location.protocol === "https:" ? "wss" : "ws";
  const host = typeof window !== "undefined" ? window.location.host : "localhost:4000";

  return (
    process.env.NEXT_PUBLIC_GRAPHQL_WS_ENDPOINT ||
    (isDevelopment ? "ws://localhost:4000/graphql" : `${protocol}//${host}/graphql`)
  );
}

/**
 * Create HTTP link for queries and mutations
 */
function createHttpLink(): HttpLink {
  return new HttpLink({
    uri: getGraphQLEndpoint(),
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    fetch: async (uri, options) => {
      // Add authorization token if available
      const token = localStorage.getItem("graphql_token");
      if (token && options?.headers) {
        (options.headers as any).Authorization = `Bearer ${token}`;
      }

      return fetch(uri as string, options);
    },
  });
}

/**
 * Create WebSocket link for subscriptions
 */
function createWsLink(): GraphQLWsLink {
  return new GraphQLWsLink(
    createClient({
      url: getWebSocketEndpoint(),
      connectionParams: () => {
        const token = localStorage.getItem("graphql_token");
        return {
          authorization: token ? `Bearer ${token}` : undefined,
        };
      },
      retryAttempts: 5,
      shouldRetry: () => true,
      keepalive: 30_000,
      on: {
        connected: () => console.log("GraphQL WebSocket connected"),
        error: (error) => console.error("GraphQL WebSocket error:", error),
        closed: () => console.log("GraphQL WebSocket closed"),
      },
    })
  );
}

/**
 * Create auth link for adding authorization headers
 */
function createAuthLink(): ApolloLink {
  return new ApolloLink((operation, forward) => {
    const token = localStorage.getItem("graphql_token");

    if (token) {
      operation.setContext({
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    return forward(operation);
  });
}

/**
 * Create split link that routes subscriptions to WebSocket and queries/mutations to HTTP
 */
function createLink(): ApolloLink {
  const httpLink = createHttpLink();
  const wsLink = createWsLink();
  const authLink = createAuthLink();

  return split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return (
        definition.kind === "OperationDefinition" &&
        definition.operation === "subscription"
      );
    },
    authLink.concat(wsLink),
    authLink.concat(httpLink)
  );
}

/**
 * Create in-memory cache with custom type policies
 */
function createCache(): InMemoryCache {
  return new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          campaigns: {
            keyArgs: ["filter", "sort"],
            merge(existing, incoming) {
              return incoming;
            },
          },
          activeCampaigns: {
            keyArgs: ["limit"],
          },
          trendingCampaigns: {
            keyArgs: ["limit"],
          },
          userContributions: {
            keyArgs: ["address", "limit"],
          },
        },
      },
      Campaign: {
        keyFields: ["id"],
      },
      Contribution: {
        keyFields: ["id"],
      },
      User: {
        keyFields: ["address"],
      },
    },
  });
}

/**
 * Create Apollo Client instance
 */
export function createApolloClient(): ApolloClient<NormalizedCacheObject> {
  return new ApolloClient({
    link: createLink(),
    cache: createCache(),
    connectToDevTools: process.env.NODE_ENV === "development",
  });
}

/**
 * Singleton Apollo Client instance
 */
let apolloClient: ApolloClient<NormalizedCacheObject> | null = null;

/**
 * Get or create Apollo Client
 */
export function getApolloClient(): ApolloClient<NormalizedCacheObject> {
  if (!apolloClient) {
    apolloClient = createApolloClient();
  }
  return apolloClient;
}

/**
 * Reset Apollo Client (useful for logout)
 */
export async function resetApolloClient(): Promise<void> {
  if (apolloClient) {
    await apolloClient.clearStore();
    apolloClient = null;
  }
}
