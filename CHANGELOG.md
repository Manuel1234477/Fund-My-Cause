# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Seed/fixture generators for local testing and development (#731)
  - `scripts/seed-testnet.sh` — Unix/Linux/Mac script to deploy sample campaigns to testnet covering all lifecycle states (active, funded, failed, refunding)
  - `scripts/seed-testnet.ps1` — Windows PowerShell version of seed script with identical functionality
  - `scripts/generate-fixtures.ts` — TypeScript fixture generator creating realistic JSON test data for E2E and component tests
  - `fixtures/README.md` — comprehensive documentation for using fixtures and seed scripts, including campaign states, usage examples, and troubleshooting
  - `docs/LOCAL_DEVELOPMENT_QUICKSTART.md` — quick start guide for local development with step-by-step setup instructions
  - `npm run fixtures:generate` — command to generate test fixtures JSON
  - `npm run seed:testnet` — command to seed testnet with sample campaigns (Unix/Linux/Mac)
  - Automatic `.env.local` generation with deployed contract IDs
  - `fixtures/seed-data.json` generation with deployment metadata and contract addresses
  - Campaign templates covering 10 different states: new, mid-progress, near goal, fully funded, failed, refunding, paused, near deadline, early stage, and low progress
  - Support for 5-50 campaigns with `--num-campaigns` option for load testing
  - Verbose mode for detailed deployment logging
  - Backup creation for `.env.local` before overwriting
- `docs/api/` — structured API reference for both contracts: `crowdfund.md`,
  `registry.md`, `types.md`, `errors.md`, `events.md`, each cross-linked.
- `docs/tutorials/` — six step-by-step guides: getting started, campaign
  creation, accepting contributions, building a dashboard, donation matching,
  and saved-search alerts.
- `sdks/js/` — typed JavaScript/TypeScript SDK (`@fund-my-cause/sdk`) exposing
  `FmcClient` (all read + write methods), `FmcRegistryClient`, `FmcContractError`,
  and unit-conversion helpers (`xlmToStroops`, `stroopsToXlm`, etc.).
- `sdks/js/src/utils.test.ts` — unit tests for all SDK utility functions.
- `playground/` — interactive testnet playground: `query.js` (read-only CLI),
  `contribute.js` (send a contribution), `run.js` (interactive menu), and
  `requests.http` (VS Code REST Client snippets for raw Soroban RPC calls).
- `examples/` — five runnable integration examples: `basic-campaign`,
  `campaign-list`, `donation-matching`, `contribution-widget` (React), and
  `event-listener` (on-chain event polling).
- Initial project setup with Soroban smart contracts
- Decentralized crowdfunding platform on Stellar network
- Pull-based refund model for scalable fund distribution
- Platform fee configuration support
- Next.js frontend with Freighter wallet integration
- Campaign registry contract for discovery
- Comprehensive test suite with snapshots
- CI/CD pipeline with GitHub Actions
- `DataKey::ContributorIndex(u32)` storage key for O(1) per-contributor writes,
  replacing the O(n) `KEY_CONTRIBS` Vec append that grew proportionally with
  campaign size.
- `estimateContributionGas(contractId, contributor, amount, tokenId)` in
  `apps/interface/src/lib/contract.ts` — simulates a contribution and returns
  the estimated network fee in stroops and XLM before the user signs.
- `getContributorsPaginated(contractId, offset, limit)` in
  `apps/interface/src/lib/contract.ts` — fetches a page of contributor addresses
  using the new indexed storage, proportional only to page size.
- `validate_refund_eligibility(now, deadline, total, goal)` in `validation.rs`
  combines the duplicate deadline + goal checks shared by `refund_single` and
  `refund_batch` into a single short-circuit function.
- Extended benchmark suite in `contract_benchmarks.rs`: `contribute_repeat_contributor`,
  `contribute_50th_contributor`, `get_stats_empty`, `get_stats_10_contributors`,
  `contributor_list_page1_of_10`, and `contributor_list_page2_of_50`.

### Changed
- `contribute()` now validates the minimum-amount constraint **before** reading
  the blacklist/whitelist from persistent storage, saving 1–2 storage reads on
  every rejected under-minimum contribution.
- `contributor_list(offset, limit)` now reads only the requested page of
  contributors via indexed persistent keys instead of deserialising the full
  contributor list on every call.
- `get_stats()` now caches the instance storage handle to reduce repeated borrow
  overhead across the four instance reads it performs.
- `get_performance_metrics()` now correctly reads contributors from persistent
  storage via indexed keys; previously it read `KEY_CONTRIBS` from instance
  storage (which was always empty), so trending was always 0.
- `refund_single()` and `refund_batch()` now delegate their eligibility checks
  to `validate_refund_eligibility()`, removing duplicated inline logic.
- `contribute_on_behalf()` now also writes `DataKey::ContributorIndex` for
  first-time delegated contributors, making them visible via `contributor_list`.

### Deprecated

### Removed

### Fixed
- `get_performance_metrics()` trending metric was always 0 because contributors
  were read from the wrong storage tier (instance instead of persistent).

### Security

## [0.1.0] - 2026-03-28

### Added
- Initial release of Fund-My-Cause
- Soroban smart contracts (crowdfund and registry)
- Next.js 16 frontend with TypeScript and Tailwind CSS
- Freighter wallet integration
- Campaign creation, contribution, and refund functionality
- Platform fee mechanism
- Automated deployment scripts
- E2E tests with Playwright
- Unit tests with Jest and Vitest

[Unreleased]: https://github.com/Fund-My-Cause/Fund-My-Cause/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Fund-My-Cause/Fund-My-Cause/releases/tag/v0.1.0
