#!/usr/bin/env node
/**
 * Interactive playground CLI.
 *
 * Usage: node scripts/run.js
 *
 * Presents a menu of contract operations. Read-only calls work without a
 * wallet; write calls need STELLAR_SECRET in .env.
 */

import "dotenv/config";
import { createInterface } from "readline";
import { execSync } from "child_process";

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((res) => rl.question(q, res));

const MENU = `
╔══════════════════════════════════════════╗
║     Fund-My-Cause Contract Playground    ║
╚══════════════════════════════════════════╝

Read-only (no wallet needed):
  1) Get campaign stats
  2) Get campaign info
  3) Check a contribution balance
  4) List contributors (first 20)
  5) Get matching config

Write (requires STELLAR_SECRET in .env):
  6) Send a contribution
  7) Withdraw (creator)
  8) Refund (contributor)

  q) Quit
`;

function run(cmd) {
  try {
    execSync(cmd, { stdio: "inherit", cwd: process.cwd() });
  } catch {
    // execSync throws on non-zero exit; errors already printed to stderr
  }
}

while (true) {
  console.log(MENU);
  const choice = (await ask("Choose an option: ")).trim();

  if (choice === "q") break;

  switch (choice) {
    case "1": run("node scripts/query.js stats");          break;
    case "2": run("node scripts/query.js info");           break;
    case "3": {
      const addr = await ask("Enter address (G...): ");
      run(`node scripts/query.js contribution "${addr.trim()}"`);
      break;
    }
    case "4": run("node scripts/query.js contributors 0 20"); break;
    case "5": run("node scripts/query.js matching");       break;
    case "6": {
      const xlm = await ask("Amount in XLM (e.g. 5): ");
      const msg = await ask("Optional message (Enter to skip): ");
      const msgArg = msg.trim() ? `"${msg.trim()}"` : "";
      run(`node scripts/contribute.js ${xlm.trim()} ${msgArg}`);
      break;
    }
    case "7": run("node scripts/withdraw.js");  break;
    case "8": run("node scripts/refund.js");    break;
    default:  console.log("Unknown option — try again.");
  }
}

rl.close();
console.log("Bye!");
