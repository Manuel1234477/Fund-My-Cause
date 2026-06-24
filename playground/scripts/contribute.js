#!/usr/bin/env node
/**
 * Send a testnet contribution to the configured campaign.
 *
 * Usage:
 *   node scripts/contribute.js <XLM_AMOUNT> [optional message]
 *
 * Example:
 *   node scripts/contribute.js 5
 *   node scripts/contribute.js 10 "Good luck!"
 *
 * Requires STELLAR_SECRET in .env (testnet key only — never use mainnet keys).
 */

import "dotenv/config";
import {
  rpc as SorobanRpc,
  Contract,
  TransactionBuilder,
  BASE_FEE,
  Keypair,
  Address,
  nativeToScVal,
  xdr,
  Horizon,
} from "@stellar/stellar-sdk";

const RPC_URL    = process.env.SOROBAN_RPC_URL    ?? "https://soroban-testnet.stellar.org";
const HORIZON    = process.env.HORIZON_URL         ?? "https://horizon-testnet.stellar.org";
const PASSPHRASE = process.env.NETWORK_PASSPHRASE  ?? "Test SDF Network ; September 2015";
const CONTRACT   = process.env.CONTRACT_ID;
const SECRET     = process.env.STELLAR_SECRET;
const TOKEN      = process.env.XLM_TOKEN_ID ?? "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";

if (!CONTRACT || !SECRET) {
  console.error("Error: CONTRACT_ID and STELLAR_SECRET must be set in .env");
  process.exit(1);
}

const [, , amountArg, ...messageParts] = process.argv;
const amountXlm = parseFloat(amountArg);

if (isNaN(amountXlm) || amountXlm <= 0) {
  console.error("Usage: node scripts/contribute.js <XLM_AMOUNT> [message]");
  process.exit(1);
}

const message        = messageParts.join(" ") || null;
const amountStroops  = BigInt(Math.round(amountXlm * 1e7));
const keypair        = Keypair.fromSecret(SECRET);
const contributor    = keypair.publicKey();

const rpc      = new SorobanRpc.Server(RPC_URL);
const horizon  = new Horizon.Server(HORIZON);
const contract = new Contract(CONTRACT);

console.log(`\nContributing ${amountXlm} XLM to campaign ${CONTRACT}`);
console.log(`From: ${contributor}`);
if (message) console.log(`Message: ${message}`);
console.log();

// Build args
const msgArg = message
  ? nativeToScVal(message, { type: "string" })
  : xdr.ScVal.scvVoid();

const account  = await horizon.loadAccount(contributor);
const tx = new TransactionBuilder(account, {
  fee: BASE_FEE,
  networkPassphrase: PASSPHRASE,
})
  .addOperation(contract.call(
    "contribute",
    new Address(contributor).toScVal(),
    nativeToScVal(amountStroops, { type: "i128" }),
    new Address(TOKEN).toScVal(),
    msgArg,
  ))
  .setTimeout(30)
  .build();

// Simulate first to catch errors early
const sim = await rpc.simulateTransaction(tx);
if (SorobanRpc.Api.isSimulationError(sim)) {
  console.error("Simulation failed:", sim.error);
  process.exit(1);
}
console.log(`Estimated resource fee: ${Number(sim.minResourceFee) / 1e7} XLM`);

// Prepare (attach resource fees + footprint), sign, submit
const prepared = await rpc.prepareTransaction(tx);
prepared.sign(keypair);

const sendResult = await rpc.sendTransaction(prepared);
if (sendResult.status === "ERROR") {
  console.error("Submit failed:", JSON.stringify(sendResult.errorResult, null, 2));
  process.exit(1);
}

console.log(`Submitted. Hash: ${sendResult.hash}`);
process.stdout.write("Polling");

// Poll for confirmation
for (let i = 0; i < 20; i++) {
  await new Promise((r) => setTimeout(r, 1500));
  process.stdout.write(".");
  const res = await rpc.getTransaction(sendResult.hash);
  if (res.status === SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
    console.log("\n✓ Confirmed!");
    console.log(`  View on Stellar Expert: https://stellar.expert/explorer/testnet/tx/${sendResult.hash}`);
    process.exit(0);
  }
  if (res.status === SorobanRpc.Api.GetTransactionStatus.FAILED) {
    console.error("\n✗ Transaction failed on-chain.");
    process.exit(1);
  }
}

console.error("\nTimed out waiting for confirmation.");
process.exit(1);
