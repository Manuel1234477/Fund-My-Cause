# Data Flow & State Management Guide

This guide documents how data moves through the application and where each kind of state lives.

## State Architecture Overview

```
┌──────────────────────────────────────────────────┐
│                    UI Layer                       │
│  Components / Pages (React 19, App Router)       │
└────────┬──────────┬──────────┬───────────────────┘
         │          │          │
         ▼          ▼          ▼
┌────────────┐ ┌────────┐ ┌──────────────────────┐
│ React Query│ │ Redux  │ │ React Context         │
│ (server    │ │ (global│ │  - WalletContext      │
│  state)    │ │  state)│ │  - ThemeContext       │
│            │ │        │ │  - NotificationCtx    │
│ staleTime  │ │ slices:│ │  - BookmarkContext    │
│ 30 s / Inf │ │ wallet │ │  - ComparisonContext  │
│ gcTime     │ │ theme  │ │  - BreadcrumbContext  │
│ 5 min / 1h │ │ notif  │ │  - ModalContext       │
│            │ │ modals │ │                      │
└──────┬─────┘ └────────┘ └──────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────┐
│              Service Layer                        │
│  campaign.service.ts   wallet.service.ts          │
│  search.service.ts     analytics.service.ts       │
│  Pure functions, no React imports                 │
└────────┬─────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────┐
│              Library Layer                        │
│  soroban.ts  (RPC client + Horizon)              │
│  rpc-cache.ts (in-memory two-tier cache)         │
│  contract.ts (tx building + submission)          │
│  pinata.ts   (IPFS storage)                      │
└────────┬─────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────┐
│           External Data Sources                   │
│  Soroban RPC  │  Horizon  │  Pinata  │  WS       │
└──────────────────────────────────────────────────┘
```

## Read Paths

### Campaign Data (Primary Read)

```
Component (e.g. CampaignDetail)
  │
  ├── useCampaign(contractId)              ← hook
  │     │
  │     └── useQuery(["campaign", id])     ← React Query
  │           │
  │           └── fetchCampaignView(id)    ← soroban.ts
  │                 │
  │                 ├── simulateView("get_campaign_info")
  │                 ├── simulateView("get_stats")
  │                 ├── simulateView("social_links")
  │                 │     │
  │                 │     └── cacheGet(key) → cacheSet(key) on miss → Soroban RPC
  │                 │
  │                 └── normalize into CampaignInfo + CampaignStats
  │
  └── Renders: info, stats, loading, error
```

| Layer | Staleness | Persistence |
|-------|-----------|-------------|
| RPC Cache (rpc-cache.ts) | 30 s TTL / Infinity (static) | In-memory only |
| React Query | staleTime 30 s / Inf, gcTime 5 min / 1 h | In-memory only |
| Component | Re-renders on query change | Ephemeral |

### Campaign List (Mock Data Path)

```
Component (e.g. CampaignsPage)
  │
  ├── useCampaigns(filters)                ← mock data
  │     │
  │     └── queryCampaigns(ALL_CAMPAIGNS, opts)  ← campaign.service.ts
  │           │
  │           ├── searchCampaigns(search, query)
  │           ├── filterCampaigns(filters)
  │           ├── sortCampaigns(sort)
  │           └── paginate(page, pageSize)
  │
  └── Renders: campaigns[], hasMore, loadMore
```

**Note:** The campaign list currently uses hardcoded mock data (`src/lib/campaigns.ts`). A future backend will replace this with indexed on-chain data. The `Campaign` type (shared via `@fund-my-cause/types`) ensures the contract between frontend and backend stays synchronized.

### Search (Client-Side)

```
SearchBar / SearchResults
  │
  └── useAdvancedSearch()
        │
        └── search.service.ts
              │
              ├── tokenize(query)
              ├── expandKeywords(query)      ← semantic map
              ├── fuzzyMatch(tokens, text)    ← Levenshtein
              ├── rankResults(campaigns)      ← TF-IDF scoring
              └── personalize(campaigns)      ← stored preferences
```

Search is entirely client-side. No external search backend is needed.

## Write Paths

### Contribute (Primary Write)

```
User clicks "Contribute"
  │
  ├── useContribute(contractId)             ← React Query mutation
  │     │
  │     ├── buildContributeTx()             ← soroban.ts (build XDR)
  │     ├── wallet.signTx(xdr)              ← Freighter / WalletConnect
  │     ├── submitSignedTx(signedXdr)       ← Horizon
  │     └── onSuccess:
  │           ├── cacheInvalidateLive(contractId)  ← rpc-cache.ts
  │           └── invalidateQueries(["campaign"])  ← React Query
  │
  └── Optimistic update:
        ├── applyOptimisticContribution()   ← useCampaign (local state)
        └── rollbackOptimistic() on error   ← useCampaign
```

### Campaign Creation

```
CreateCampaignWizard
  │
  ├── buildInitializeTx(params)             ← soroban.ts
  ├── wallet.signTx(xdr)
  ├── submitSignedTx(signedXdr)
  └── On success → navigate to campaign page
```

### Wallet Connection

```
User clicks "Connect Wallet"
  │
  ├── WalletContext.connect()
  │     │
  │     ├── freighter.getAddress() / WalletConnect
  │     ├── wallet.service.saveSession()    ← sessionStorage
  │     └── dispatch(wallet/setAddress)
  │
  └── On reload:
        ├── WalletContext reads persisted wallet from Redux
        └── wallet.service.loadSession()    ← sessionStorage
```

## Where Each Kind of State Lives

| State | Tool | Location | Persistence | Why Here |
|-------|------|----------|-------------|----------|
| Campaign data (on-chain) | React Query | `useCampaign` hook / query cache | In-memory (refetched on mount) | Server state: owned by the chain, cached locally |
| Campaign mock list | Module-level const | `src/lib/campaigns.ts` | Hardcoded | Placeholder until indexing backend exists |
| Wallet connection | Redux + Context | `walletSlice` + `WalletContext` | localStorage via redux-persist | Global: needed everywhere, survives refresh |
| Theme preference | Redux | `themeSlice` | localStorage | Global: persists across sessions |
| Notifications | Redux | `notificationSlice` | localStorage | Global toast queue with persistence |
| Modal stack | Redux | `modalSlice` | None (ephemeral) | Global modal management, no persistence needed |
| Bookmarked campaigns | Context | `BookmarkContext` | None (ephemeral) | Feature-scoped: only bookmark UI needs it |
| Comparison cart | Context | `ComparisonContext` | None (ephemeral) | Feature-scoped: only comparison page |
| Breadcrumbs | Context | `BreadcrumbContext` | None (ephemeral) | Feature-scoped: only navigation |
| RPC cache entries | Module-level Map | `rpc-cache.ts` | In-memory | Opaque to React; React Query is the public API |
| Search index | Module-level | `search.service.ts` | In-memory | Built from campaign list on init |
| Form state | Local `useState` | Component | None (ephemeral) | Scoped to a single form |
| Optimistic updates | Local `useState` | `useCampaign` | None (ephemeral) | Scoped to a single campaign view |

## How to Add a New Data Source

Follow these steps to integrate a new external data source correctly:

### 1. Define types in `packages/types/src/`

If your data has domain meaning (campaign, contribution, user, etc.), add the types to the shared package. This ensures frontend and any future backend share the same definitions.

```typescript
// packages/types/src/your-domain.ts
export interface YourData {
  id: string;
  // …
}
```

Re-export from `packages/types/src/index.ts`.

### 2. Add a library module

Create a file in `apps/interface/src/lib/` for raw data access (RPC calls, API fetch, WebSocket handling).

```typescript
// apps/interface/src/lib/your-source.ts
export async function fetchYourData(id: string): Promise<YourData> {
  const response = await fetch(`https://api.example.com/data/${id}`);
  return response.json();
}
```

### 3. Add caching (if appropriate)

- **RPC calls**: Use `rpc-cache.ts` (`cacheGet`/`cacheSet`)
- **HTTP API calls**: Use React Query's built-in caching (`staleTime`, `gcTime`)
- **Static data**: Mark with `staleTime: Infinity`
- **Live data**: Use 30–60 second TTL

### 4. Add a React Query hook

```typescript
// apps/interface/src/hooks/useYourData.ts
export function useYourData(id: string) {
  return useQuery({
    queryKey: ["your-data", id],
    queryFn: () => fetchYourData(id),
    staleTime: 30_000,
  });
}
```

### 5. Use the hook in components

```typescript
function YourComponent({ id }: { id: string }) {
  const { data, isLoading, error } = useYourData(id);
  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error.message} />;
  return <div>{/* render data */}</div>;
}
```

### 6. Add a service function (if business logic exists)

If the raw data needs transformation, filtering, or enrichment, add a pure function in `src/services/` and test it independently.

### Decision Flowchart

```
New data source?
  │
  ├── Is it on-chain (Soroban)?
  │     → Use simulateView in soroban.ts
  │     → Cache with rpc-cache.ts
  │     → Expose via React Query hook
  │
  ├── Is it an HTTP API?
  │     → Add fetch fn in src/lib/
  │     → Use React Query (no manual cache needed)
  │
  ├── Is it WebSocket / real-time?
  │     → Add service in src/services/
  │     → Connect in context or hook
  │     → Update Redux or React Query on message
  │
  └── Is it client-only (localStorage, IndexedDB)?
        → Use Context for scoped state
        → Use Redux if multiple features need it
```

## State Decision Guide

Adding new state? Ask these questions in order:

1. **Is it server/remote state?** → React Query (query key, stale time, gc time)
2. **Is it global UI state needed by many components?** → Redux (with redux-persist if it should survive refresh)
3. **Is it scoped to a feature subtree?** → React Context
4. **Is it local to a single component?** → `useState` / `useReducer`
5. **Is it derived from existing state?** → `useMemo` (don't store it separately)

## Data Flow Diagram (Textual)

```
┌─────────────────────────────────────────────────────────┐
│  Browser                                                 │
│                                                          │
│  ┌──────────┐    ┌──────────┐    ┌──────────────────┐   │
│  │  Pages   │───▶│ Hooks    │───▶│ Services         │   │
│  │          │    │          │    │ (pure functions)  │   │
│  │ campaign │    │useCampgn│    │ campaign.service  │   │
│  │ dashboard│    │useContrb│    │ wallet.service    │   │
│  │  create  │    │useSearch│    │ search.service    │   │
│  └──────────┘    └──────────┘    └────────┬─────────┘   │
│                                            │            │
│  ┌──────────┐    ┌──────────┐              │            │
│  │  Redux   │    │ Context  │              │            │
│  │ Store    │    │ Wallet   │              │            │
│  │ (persist)│    │ (session)│              ▼            │
│  └──────────┘    └──────────┘    ┌──────────────────┐   │
│                                  │  Libraries        │   │
│                                  │ soroban.ts        │   │
│                                  │ rpc-cache.ts      │   │
│                                  │ contract.ts       │   │
│                                  └────────┬─────────┘   │
│                                           │             │
└───────────────────────────────────────────┼─────────────┘
                                            │
                    ┌───────────────────────┼───────────────┐
                    │  Network              │               │
                    │                       ▼               │
                    │  ┌────────────┐  ┌──────────┐        │
                    │  │Soroban RPC │  │ Horizon  │        │
                    │  │(simulateTx)│  │ (submit) │        │
                    │  └────────────┘  └──────────┘        │
                    │  ┌────────────┐  ┌──────────┐        │
                    │  │  Pinata    │  │ CoinGecko│        │
                    │  │  (IPFS)    │  │ (pricing)│        │
                    │  └────────────┘  └──────────┘        │
                    └──────────────────────────────────────┘
```
