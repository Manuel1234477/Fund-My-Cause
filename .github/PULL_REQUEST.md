## Summary

Implements four CI/CD workflow improvements in a single branch.

Closes Fund-My-Cause/Fund-My-Cause#718 · Closes Fund-My-Cause/Fund-My-Cause#719 · Closes Fund-My-Cause/Fund-My-Cause#720 · Closes Fund-My-Cause/Fund-My-Cause#721

---

## Changes

### #718 — Reproducible WASM build verification

**Files:** `.github/workflows/reproducible-wasm.yml`, `rust-toolchain.toml`

- Adds `rust-toolchain.toml` pinning the toolchain to `1.86.0` with `wasm32-unknown-unknown` target — ensures every machine builds with the exact same compiler.
- New workflow builds the contracts twice with a `cargo clean` in between, computes SHA-256 hashes of all `.wasm` outputs, and fails if any hash differs.
- Publishes a `wasm-hashes-<sha>.sha256` file plus a markdown build report as a 90-day artifact per run (retained per release for auditability).
- Job step summary shows a formatted table of contract name → hash for easy inspection.

### #721 — Release Please: automated changelog & versioning

**Files:** `.github/workflows/release-please.yml`, `release-please-config.json`, `.release-please-manifest.json`

- Adds `googleapis/release-please-action@v4` triggered on every push to `main`.
- Conventional commits are parsed automatically; release-please opens a versioning PR that bumps `package.json`, updates `CHANGELOG.md`, and creates a GitHub Release with full release notes.
- Monorepo config in `release-please-config.json` keeps the changelog at the repo root and mirrors the version into `apps/interface/package.json`.
- Current version seeded at `0.1.0` in `.release-please-manifest.json`.

### #720 — Dependency update PR validation

**File:** `.github/workflows/dependency-update.yml`

- **Rust matrix** — builds WASM and runs `cargo test` on both `ubuntu-latest` and `macos-latest` for every Dependabot PR labelled `dependencies`.
- **Frontend matrix** — lint + typecheck + `test:coverage` against Node 18, 20, and 22.
- **Security audit** — `npm audit --audit-level=high` + `cargo audit` in a dedicated job.
- **Changelog diff comment** — sticky PR comment shows package name, ecosystem, previous/new version, update type, and a link to the npm/crates.io changelog.
- **Auto-merge** — patch updates are auto-merged via `gh pr merge --auto --squash` once all matrix jobs pass; minor/major updates receive a `needs-review` label.

### #719 — PR preview deployment

**File:** `.github/workflows/pr-preview.yml`

- Triggers on `opened`, `synchronize`, `reopened`, and `closed` for PRs touching `apps/interface/**`.
- On open/update: builds Next.js and deploys to Vercel, then posts a sticky comment with the live preview URL and commit SHA.
- On close: calls the Vercel REST API to delete all preview deployments for the PR, then updates the comment to show "Removed".
- Requires three repository secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
  Optional: `PREVIEW_CONTRACT_ID`, `PREVIEW_RPC_URL` (defaults to testnet if absent).

---

## Required secrets

| Secret | Used by | Description |
|---|---|---|
| `VERCEL_TOKEN` | pr-preview | Vercel API token |
| `VERCEL_ORG_ID` | pr-preview | Vercel team/org ID |
| `VERCEL_PROJECT_ID` | pr-preview | Vercel project ID |
| `PREVIEW_CONTRACT_ID` | pr-preview | Testnet contract ID for previews (optional) |
| `PREVIEW_RPC_URL` | pr-preview | Soroban RPC URL for previews (optional) |

---

## Checklist

- [x] Conventional commit messages used
- [x] No breaking changes to existing workflows
- [x] All new jobs use pinned action versions (`@v4`, `@v2`)
- [x] Secrets referenced but not hardcoded
- [x] Toolchain pinned via `rust-toolchain.toml` for reproducible builds
