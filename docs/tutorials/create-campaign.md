# Create Your First Campaign

This tutorial shows how to deploy and initialize a crowdfund campaign contract programmatically from a TypeScript/Node script.

## Prerequisites

```bash
npm install @stellar/stellar-sdk dotenv
```

`.env`:
```
STELLAR_SECRET=S...          # testnet secret key
TOKEN_ID=CDLZFC3SYJYD...     # testnet XLM or your token
SOROBAN_RPC=https://soroban-testnet.stellar.org
HORIZON_URL=https://horizon-testnet.stellar.org
NETWORK_PASSPHRASE=Test SDF Network ; September 2015
CROWDFUND_WASM_HASH=<hash from cargo build>
```

## Script

```ts
// scripts/create-campaign.ts
import "dotenv/config";
import {
  Keypair, Networks, TransactionBuilder, BASE_FEE,
  Operation, xdr, Address, nativeToScVal,
  Horizon, rpc as SorobanRpc,
} from "@stellar/stellar-sdk";

const secret       = process.env.STELLAR_SECRET!;
const tokenId      = process.env.TOKEN_ID!;
const rpcUrl       = process.env.SOROBAN_RPC!;
const horizonUrl   = process.env.HORIZON_URL!;
const networkPass  = process.env.NETWORK_PASSPHRASE!;
const wasmHash     = process.env.CROWDFUND_WASM_HASH!;

const keypair = Keypair.fromSecret(secret);
const creator = keypair.publicKey();

async function main() {
  const horizon = new Horizon.Server(horizonUrl);
  const rpc     = new SorobanRpc.Server(rpcUrl);
  const account = await horizon.loadAccount(creator);

  // ── Step 1: Upload WASM (skip if already uploaded) ───────────────────
  // Use `stellar contract upload --wasm target/wasm32-unknown-unknown/release/crowdfund.wasm`
  // and note the returned hash in CROWDFUND_WASM_HASH.

  // ── Step 2: Deploy a contract instance ───────────────────────────────
  const deployTx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: networkPass,
  })
    .addOperation(
      Operation.invokeHostFunction({
        func: xdr.HostFunction.hostFunctionTypeCreateContract(
          new xdr.CreateContractArgs({
            contractIdPreimage: xdr.ContractIdPreimage
              .contractIdPreimageFromAddress(new xdr.ContractIdPreimageFromAddress({
                address: new Address(creator).toScAddress(),
                salt: Buffer.alloc(32),
              })),
            executable: xdr.ContractExecutable.contractExecutableWasm(
              Buffer.from(wasmHash, "hex"),
            ),
          }),
        ),
        auth: [],
      }),
    )
    .setTimeout(30)
    .build();

  const prepared  = await rpc.prepareTransaction(deployTx);
  prepared.sign(keypair);
  const deployResult = await rpc.sendTransaction(prepared);
  const contractId   = /* parse from deployResult returnValue */ "";

  console.log("Contract ID:", contractId);

  // ── Step 3: Initialize the campaign ──────────────────────────────────
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 30 * 86400); // 30 days

  const account2 = await horizon.loadAccount(creator); // reload sequence
  const initTx = new TransactionBuilder(account2, {
    fee: BASE_FEE,
    networkPassphrase: networkPass,
  })
    .addOperation(
      new xdr.Operation(/* contract.call("initialize", ...) */),
    )
    .setTimeout(30)
    .build();

  // Use the JS SDK helper from sdks/js/src/index.ts instead of raw XDR:
  // await fmcClient.initialize({ contractId, creator, token: tokenId, goal: ... });

  console.log("Campaign initialized. Share your contract ID:", contractId);
}

main().catch(console.error);
```

> **Tip:** Use the [Fund-My-Cause JS SDK](../../sdks/js/README.md) to skip the raw XDR boilerplate. The SDK exposes typed `initialize()`, `contribute()`, and `withdraw()` methods.

## Via the deploy script (easier)

```bash
DEADLINE=$(date -v+30d +%s 2>/dev/null || date -d "+30 days" +%s)

./scripts/deploy.sh \
  "$CREATOR_ADDRESS" \
  "$TOKEN_ID" \
  1000000000 \
  "$DEADLINE" \
  10000000 \
  "My Campaign" \
  "A cause worth funding" \
  null \
  "$REGISTRY_ID"
```

## What happens on-chain

1. A new `CrowdfundContract` WASM instance is deployed.
2. `initialize()` is called, setting creator, goal, deadline, token, and metadata.
3. The contract address is registered in the Registry contract.
4. The `initialized` and `indexed` events are emitted.
5. Status is `Active` — the campaign is ready to accept contributions.

## Next steps

- [Accept contributions in your app →](./accept-contributions.md)
- [Set up donation matching →](./donation-matching.md)
