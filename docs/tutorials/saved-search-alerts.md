# Saved Search & Alert Subscriptions

This tutorial shows how to use the saved-search feature added in issue #631 to persist filter sets and receive notifications when new matching campaigns appear.

## How it works

1. A user applies filters in the campaign discovery page (category, status, goal range, etc.).
2. They click **Save current search** and give it a name.
3. The filter set is stored in `localStorage` keyed by wallet address.
4. A background polling loop (every 60 s) compares all saved searches against the live campaign list.
5. When a new campaign matches a saved search it has not seen before, a `NotificationContext` notification is fired.

---

## Using `useSavedSearches` in your own page

```tsx
"use client";

import { useSavedSearches } from "@/hooks/useSavedSearches";
import { useAdvancedSearch } from "@/hooks/useAdvancedSearch";
import { useWallet } from "@/context/WalletContext";
import { ALL_CAMPAIGNS } from "@/lib/campaigns";

export function MySearchPage() {
  const { address } = useWallet();
  const { filters, hasActiveFilters, restoreFilters, ...search } =
    useAdvancedSearch(ALL_CAMPAIGNS);

  const { savedSearches, saveSearch, editSearch, removeSearch } =
    useSavedSearches(ALL_CAMPAIGNS, address ?? "");

  return (
    <>
      {/* Your search UI here */}

      {/* Save current filters */}
      {hasActiveFilters && (
        <button onClick={() => saveSearch("My tech campaigns", filters)}>
          Save this search
        </button>
      )}

      {/* List saved searches */}
      <ul>
        {savedSearches.map((s) => (
          <li key={s.id}>
            <button onClick={() => restoreFilters(s.filters)}>{s.name}</button>
            <button onClick={() => editSearch(s.id, { name: "New name" })}>Rename</button>
            <button onClick={() => removeSearch(s.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </>
  );
}
```

---

## Using `SavedSearchManager` (the built-in UI panel)

The `AdvancedSearch` component already renders `SavedSearchManager` when you pass the saved-search props:

```tsx
<AdvancedSearch
  {/* ...existing props... */}
  savedSearches={savedSearches}
  onSaveSearch={(name) => saveSearch(name, filters)}
  onRestoreSearch={restoreFilters}
  onDeleteSearch={removeSearch}
  onRenameSearch={(id, name) => editSearch(id, { name })}
/>
```

The panel only renders when `onSaveSearch` is provided, so existing usages without these props are unaffected.

---

## The alert matching engine

`checkSavedSearchAlerts` in `savedSearch.service.ts` is a pure function you can call anywhere:

```ts
import { checkSavedSearchAlerts } from "@/services/savedSearch.service";

const alerts = checkSavedSearchAlerts(savedSearches, latestCampaigns, walletAddress);

for (const alert of alerts) {
  console.log(
    `"${alert.savedSearch.name}" has ${alert.newCampaigns.length} new matches:`,
    alert.newCampaigns.map((c) => c.title),
  );
}
```

It mutates `seenIds` in place on each call, so subsequent calls with the same searches will not re-fire the same alerts.

---

## Persisting saved searches to a backend

By default, searches are stored in `localStorage`. To sync with a backend, wrap `persistSavedSearches` / `loadSavedSearches`:

```ts
// services/savedSearch.remote.ts
import type { SavedSearch } from "@/services/savedSearch.service";

export async function loadFromBackend(walletAddress: string): Promise<SavedSearch[]> {
  const res = await fetch(`/api/saved-searches?wallet=${walletAddress}`);
  return res.json();
}

export async function saveToBackend(searches: SavedSearch[]): Promise<void> {
  await fetch("/api/saved-searches", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(searches),
  });
}
```

Then override the `useEffect` that calls `persistSavedSearches` in `useSavedSearches.ts` with your remote calls.

---

## Adjusting the poll interval

The default poll interval is **60 seconds** (`POLL_INTERVAL_MS` in `useSavedSearches.ts`). Reduce it for more responsive alerts (at the cost of more re-renders) or increase it to reduce CPU usage on pages with many campaigns:

```ts
// useSavedSearches.ts
const POLL_INTERVAL_MS = 30_000; // 30 seconds
```
