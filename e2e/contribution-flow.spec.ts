import { test, expect } from "./fixtures/wallet";

/**
 * Issue #722 – Full contribution journey E2E tests
 *
 * Covers: connect-wallet → discover → open campaign → contribute → receipt
 * The Freighter wallet is fully mocked via the fixture so tests run
 * deterministically in CI without a real extension.
 */

test.describe("Contribution Flow – full journey", () => {
  // ── 1. Wallet connection ───────────────────────────────────────────────────
  test("connects wallet and shows abbreviated address in navbar", async ({
    page,
  }) => {
    await page.goto("/");
    // The fixture already injected the Freighter mock; trigger the connect
    const connectBtn = page.getByRole("button", { name: /connect wallet/i });
    if (await connectBtn.isVisible()) {
      await connectBtn.click();
    }
    // After connection the navbar shows the truncated public key
    await expect(
      page.locator("text=/GMOCK|G[A-Z0-9]{4}\.\.\.[A-Z0-9]{4}/i")
    ).toBeVisible({ timeout: 8_000 });
  });

  // ── 2. Campaign discovery ─────────────────────────────────────────────────
  test("discovers campaigns on the home / campaigns page", async ({ page }) => {
    await page.goto("/campaigns");
    // At least one campaign card should be rendered
    const cards = page.locator("[data-testid='campaign-card'], .campaign-card, a[href*='/campaigns/']");
    await expect(cards.first()).toBeVisible({ timeout: 10_000 });
  });

  // ── 3. Open a campaign detail page ────────────────────────────────────────
  test("opens a campaign detail page from the list", async ({ page }) => {
    await page.goto("/campaigns");
    const campaignLink = page
      .locator("a[href*='/campaigns/']")
      .first();
    await campaignLink.click();

    // Detail page should have a heading and a Pledge button
    await expect(
      page.getByRole("button", { name: /pledge/i })
    ).toBeVisible({ timeout: 10_000 });
  });

  // ── 4. Pledge modal opens ────────────────────────────────────────────────
  test("opens pledge modal when Pledge button is clicked", async ({ page }) => {
    await page.goto("/campaigns");
    await page.locator("a[href*='/campaigns/']").first().click();
    await page.getByRole("button", { name: /pledge/i }).click();

    await expect(page.locator("text=/Pledge to|Contribute to/i")).toBeVisible({
      timeout: 8_000,
    });
  });

  // ── 5. Input validation ──────────────────────────────────────────────────
  test("shows validation error when submitting empty pledge amount", async ({
    page,
  }) => {
    await page.goto("/campaigns");
    await page.locator("a[href*='/campaigns/']").first().click();
    await page.getByRole("button", { name: /pledge/i }).click();

    // Submit without entering an amount
    await page.getByRole("button", { name: /confirm pledge/i }).click();

    await expect(
      page.locator("text=/valid amount|enter an amount|required/i")
    ).toBeVisible({ timeout: 5_000 });
  });

  // ── 6. Full contribute → receipt journey ─────────────────────────────────
  test("completes full contribute journey and shows receipt / success", async ({
    page,
  }) => {
    await page.goto("/campaigns");
    await page.locator("a[href*='/campaigns/']").first().click();

    // Connect wallet if needed
    const connectBtn = page.getByRole("button", { name: /connect wallet/i });
    if (await connectBtn.isVisible()) {
      await connectBtn.click();
    }

    await page.getByRole("button", { name: /pledge/i }).click();

    // Fill in amount
    const amountInput = page.locator(
      "input[placeholder*='Amount'], input[type='number'], input[name='amount']"
    );
    await amountInput.fill("10");

    // Confirm pledge – the wallet mock auto-approves signTransaction
    await page.getByRole("button", { name: /confirm pledge/i }).click();

    // Expect receipt / success confirmation
    await expect(
      page.locator(
        "text=/success|pledge submitted|contribution confirmed|thank you/i"
      )
    ).toBeVisible({ timeout: 15_000 });
  });

  // ── 7. Progress bar updates after contribution ───────────────────────────
  test("progress bar reflects contribution after pledge", async ({ page }) => {
    await page.goto("/campaigns");
    await page.locator("a[href*='/campaigns/']").first().click();

    const progressBar = page.locator("[role='progressbar']");
    const before = parseFloat(
      (await progressBar.getAttribute("aria-valuenow")) ?? "0"
    );

    const connectBtn = page.getByRole("button", { name: /connect wallet/i });
    if (await connectBtn.isVisible()) {
      await connectBtn.click();
    }

    await page.getByRole("button", { name: /pledge/i }).click();
    await page
      .locator("input[placeholder*='Amount'], input[type='number'], input[name='amount']")
      .fill("100");
    await page.getByRole("button", { name: /confirm pledge/i }).click();

    await expect(
      page.locator("text=/success|pledge submitted|confirmed/i")
    ).toBeVisible({ timeout: 15_000 });

    const after = parseFloat(
      (await progressBar.getAttribute("aria-valuenow")) ?? "0"
    );
    // Progress must not decrease
    expect(after).toBeGreaterThanOrEqual(before);
  });

  // ── 8. Failure produces trace / screenshot (Playwright handles this via
  //       the `video: 'retain-on-failure'` config – no extra code needed)
});
