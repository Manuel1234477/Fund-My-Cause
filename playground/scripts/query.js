#!/usr/bin/env node
/**
 * Read-only contract queries — no wallet or signing required.
 *
 * Usage:
 *   node scripts/query.js stats
 *   node scripts/query.js info
 *   node scripts/query.js contribution <ADDRESS>
 *   node scripts/query.js contributors [offset] [limit]
 *   node scripts/query.js matching
 */

import "dotenv/config";
import {
  rpc as SorobanRpc,
  Contract,
  TransactionBuilder,
  BASE_FEE,
  scValToNative,
  nativeToScVal,
  Address,
} from "@stellar/stellar-sdk";

const RPC_URL    = process.env.SOROBAN_RPC_URL    ?? "https://soroban-testnet.stellar.org";
const PASSPHRASE = process.env.NETWORK_PASSPHRASE ?? "Test SDF Network ; September 2015";
const CONTRACT   = process.env.CONTRACT_ID;

if (!CONTRACT) {
  console.error("Error: CONTRACT_ID not set in .env");
  process.exit(1);
}

const rpc      = new SorobanRpc.Server(RPC_URL);
const contract = new Contract(CONTRACT);

// Dummy account — simulation only, never submitted
const DUMMY_ACCOUNT = {
  accountId:               () => "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN",
  sequenceNumber:          () => "0",
  incrementSequenceNumber: () => {},
};

async function view(method, args = []) {
  const tx = new TransactionBuilder(DUMMY_ACCOUNT, {
    fee: BASE_FEE,
    networkPassphrase: PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const result = await rpc.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(result)) {
    throw new Error(`Simulation error: ${result.error}`);
  }
  return scValToNative(result.result.retval);
}

function xlm(stroops) {
  return (Number(BigInt(stroops)) / 1e7).toFixed(7) + " XLM";
}

const [, , command, ...args] = process.argv;

switch (command) {
  case "stats": {
    const s = await view("get_stats");
    console.log("Campaign Stats");
    console.log("  Raised:        ", xlm(s.total_raised));
    console.log("  Goal:          ", xlm(s.goal));
    console.log("  Progress:      ", (s.progress_bps / 100).toFixed(1) + "%");
    console.log("  Contributors:  ", s.contributor_count);
    console.log("  Avg pledge:    ", xlm(s.average_contribution));
    console.log("  Largest:       ", xlm(s.largest_contribution));
    break;
  }

  case "info": {
    const i = await view("get_campaign_info");
    console.log("Campaign Info");
    console.log("  Title:         ", i.title);
    console.log("  Status:        ", JSON.stringify(i.status));
    console.log("  Goal:          ", xlm(i.goal));
    console.log("  Deadline:      ", new Date(Number(i.deadline) * 1000).toISOString());
    console.log("  Min contrib:   ", xlm(i.min_contribution));
    console.log("  Creator:       ", i.creator);
    break;
  }

  case "contribution": {
    const addr = args[0];
    if (!addr) { console.error("Usage: query.js contribution <ADDRESS>"); process.exit(1); }
    const amount = await view("contribution", [new Address(addr).toScVal()]);
    console.log(`Contribution for ${addr}: ${xlm(amount)}`);
    break;
  }

  case "contributors": {
    const offset = Number(args[0] ?? 0);
    const limit  = Number(args[1] ?? 20);
    const list   = await view("contributor_list", [
      nativeToScVal(offset, { type: "u32" }),
      nativeToScVal(limit,  { type: "u32" }),
    ]);
    console.log(`Contributors (offset=${offset}, limit=${limit}):`);
    list.forEach((addr, i) => console.log(`  ${offset + i + 1}. ${addr}`));
    break;
  }

  case "matching": {
    const config = await view("get_matching_config");
    const pool   = await view("get_matching_pool");
    const total  = await view("get_total_matched");
    if (!config) {
      console.log("No matching configured.");
    } else {
      console.log("Matching Config");
      console.log("  Sponsor:       ", config.sponsor);
      console.log("  Ratio:         ", (config.match_ratio / 100).toFixed(0) + "%");
      console.log("  Cap:           ", xlm(config.max_match));
      console.log("  Total matched: ", xlm(total));
      console.log("  Pool remaining:", xlm(pool));
    }
    break;
  }

  default:
    console.log("Commands: stats | info | contribution <ADDR> | contributors [offset] [limit] | matching");
}
