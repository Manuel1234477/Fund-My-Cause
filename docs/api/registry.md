# Registry Contract API

**Source:** `contracts/registry/src/lib.rs`

A lightweight on-chain directory that maps campaign contract addresses for frontend discovery. Neither contract calls the other on-chain — registration happens off-chain from the deploy script.

---

## Functions

### `register`

Adds a campaign address to the directory. Idempotent — calling twice with the same address is a no-op.

```rust
pub fn register(env: Env, campaign_id: Address)
```

**Events:** `("registry", "registered")` with `campaign_id` as data

```bash
stellar contract invoke \
  --id $REGISTRY_ID --source $DEPLOYER --network testnet \
  -- register --campaign_id $CONTRACT_ID
```

---

### `register_with_category`

Register a campaign under a specific category for filtered discovery.

```rust
pub fn register_with_category(env: Env, campaign_id: Address, category_id: u32)
```

Category IDs map to the `Category` enum:

| `category_id` | Name |
|---------------|------|
| 0 | Charity |
| 1 | Technology |
| 2 | Creative |
| 3 | Event |
| 4 | Personal |
| 5 | Other |

---

### `list`

Paginated slice of all registered campaigns in registration order.

```rust
pub fn list(env: Env, offset: u32, limit: u32) -> Vec<Address>
```

Returns an empty vector when `offset >= total` or `limit == 0`.

```ts
// Fetch all campaigns in pages of 20
const PAGE = 20;
let offset = 0;
const all: string[] = [];

while (true) {
  const page = await simulateView(REGISTRY_ID, "list", [
    nativeToScVal(offset, { type: "u32" }),
    nativeToScVal(PAGE,   { type: "u32" }),
  ]) as string[];
  if (page.length === 0) break;
  all.push(...page);
  offset += PAGE;
}
```

---

### `get_campaigns_by_category`

Paginated campaigns filtered by category.

```rust
pub fn get_campaigns_by_category(
    env: Env,
    category_id: u32,
    offset: u32,
    limit: u32,
) -> Vec<Address>
```

```ts
// First 10 Technology (id=1) campaigns
const tech = await simulateView(REGISTRY_ID, "get_campaigns_by_category", [
  nativeToScVal(1,  { type: "u32" }),
  nativeToScVal(0,  { type: "u32" }),
  nativeToScVal(10, { type: "u32" }),
]);
```
