import { test, expect } from "@playwright/test";

/**
 * Sales-rep POS flow e2e (invoice mode — no payment gateway involved).
 *
 * Requires a seeded rep account on the target API. Against an environment
 * without one (e.g. prod), login fails and the spec skips itself — so it can
 * never mutate a store it wasn't pointed at deliberately.
 *
 * Order placement (a REAL pending_payment order) only happens with
 * REP_E2E_PLACE_ORDER=1; otherwise the spec stops at the payment step.
 */
const REP_EMAIL = process.env.REP_E2E_EMAIL || "demorep@elementalpeptides.com";
const REP_PASSWORD = process.env.REP_E2E_PASSWORD || "RepDemo123!";
const PLACE_ORDER = process.env.REP_E2E_PLACE_ORDER === "1";

test.beforeEach(async ({ context }) => {
  await context.addCookies([
    { name: "age_confirmed", value: "1", url: "http://localhost:3003" },
  ]);
});

test("rep signs in, lands on POS dashboard, and walks the new-sale flow", async ({
  page,
}) => {
  // ── Sign in ────────────────────────────────────────────────────────────
  await page.goto("/login");
  await page.locator('input[type="email"]').fill(REP_EMAIL);
  await page.locator('input[type="password"]').fill(REP_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();

  // Reps are redirected to /rep; anyone else lands on /account.
  await page
    .waitForURL(/\/(rep|account)/, { timeout: 20_000 })
    .catch(() => {});
  if (!page.url().includes("/rep")) {
    console.warn(
      "rep.spec: rep login did not land on /rep — no seeded rep on this environment; skipping"
    );
    return;
  }

  // ── Dashboard ──────────────────────────────────────────────────────────
  // Two "New Sale" links exist (nav tab + big CTA) — assert the CTA.
  await expect(
    page.getByRole("link", { name: /^new sale$/i }).last()
  ).toBeVisible();
  await expect(page.getByText(/rep portal/i).first()).toBeVisible();

  // ── Step 1: choose the customer ────────────────────────────────────────
  // The sale opens on the customer picker — the catalog prices at the
  // customer's tier and checkout needs them, so they come first.
  await page.getByRole("link", { name: /^new sale$/i }).last().click();
  await page.waitForURL(/\/rep\/new-sale/);
  await expect(page.getByText(/who is this sale for/i)).toBeVisible();

  const firstCustomer = page
    .locator("button", { hasText: "@" }) // customer rows show the email
    .first();
  await firstCustomer.waitFor({ timeout: 15_000 });
  await firstCustomer.click();

  // ── Step 2: build the order ───────────────────────────────────────────
  const addButton = page.getByRole("button", { name: /^add$/i }).first();
  await addButton.waitFor({ timeout: 20_000 });
  await addButton.click();

  // The rail (or mobile summary) reflects the line; continue is enabled.
  const continueCheckout = page.getByRole("button", {
    name: /continue to checkout/i,
  });
  await expect(continueCheckout).toBeEnabled({ timeout: 15_000 });
  await continueCheckout.click();

  // ── Step 3: checkout — shipping AND payment on one screen ─────────────
  await page.locator('[id="rep-ship-line1"]').fill("100 Test Ave");
  await page.locator('[id="rep-ship-city"]').fill("Austin");
  await page.locator('[id="rep-ship-zip"]').fill("78701");

  // Base UI state select (only when empty — last-ship-to prefill may have set it)
  const stateValue = await page.locator('[name="state"]').inputValue();
  if (!stateValue) {
    await page.locator('[id="rep-ship-state"]').click();
    const listbox = page.getByRole("listbox");
    await listbox.waitFor({ timeout: 10_000 });
    await listbox.getByRole("option", { name: /texas/i }).first().click()
      .catch(async () => {
        await listbox.getByRole("option").first().click();
      });
  }
  await expect(page.locator('[name="country"]')).not.toHaveValue("");

  // No step boundary — payment modes are already on screen below shipping.
  const invoiceMode = page.getByRole("radio", { name: /invoice/i });
  await expect(invoiceMode).toBeVisible();
  await invoiceMode.click();

  const placeButton = page.getByRole("button", { name: /place unpaid order/i });
  await expect(placeButton).toBeEnabled();

  if (!PLACE_ORDER) {
    console.warn(
      "rep.spec: REP_E2E_PLACE_ORDER not set — stopping before order placement"
    );
    return;
  }

  // ── Place the invoice order + confirmation ────────────────────────────
  await placeButton.click();
  await page
    .getByRole("button", { name: /^place order$/i })
    .click(); // confirm dialog

  await expect(page.getByText(/order placed/i)).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByRole("button", { name: /^new sale$/i })).toBeVisible();
});
