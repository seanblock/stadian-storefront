import { test, expect } from "@playwright/test";

// Needs a store that is really closed in the API, with its preview password in
// PREVIEW_PASSWORD. Skipped otherwise: STORE_CLOSED_OVERRIDE only closes the
// storefront, and the API's own gate is what this covers.
const password = process.env.PREVIEW_PASSWORD;

test.describe("preview password on a closed store", () => {
  test.skip(!password, "set PREVIEW_PASSWORD for a store that is closed in the API");

  test("unlocks the real store, including the catalog the API withholds", async ({ page, context, baseURL }) => {
    await page.goto("/products");
    await expect(page.getByRole("heading", { name: /coming soon/i })).toBeVisible();

    const reveal = page.getByRole("button", { name: /preview|password/i });
    if (await reveal.isVisible().catch(() => false)) await reveal.click();
    await page.getByPlaceholder("Preview password").fill(password!);
    await page.getByRole("button", { name: "Enter store" }).click();
    // The unlock is a server action: wait for its cookies before navigating away.
    await expect
      .poll(async () => (await context.cookies()).some((c) => c.name === "sf_preview_grant"))
      .toBe(true);

    // Age gate, if the store has one, then the catalog the API only serves with a grant.
    await context.addCookies([{ name: "age_confirmed", value: "1", url: baseURL! }]);
    await page.goto("/products");
    await expect(page.locator('main a[href^="/products/"]').first()).toBeVisible();

    const grant = (await context.cookies()).find((c) => c.name === "sf_preview_grant");
    expect(grant?.httpOnly).toBe(true);
  });

  test("a wrong password unlocks nothing", async ({ page }) => {
    await page.goto("/");
    const reveal = page.getByRole("button", { name: /preview|password/i });
    if (await reveal.isVisible().catch(() => false)) await reveal.click();
    await page.getByPlaceholder("Preview password").fill("definitely-wrong");
    await page.getByRole("button", { name: "Enter store" }).click();
    await page.goto("/products");
    await expect(page.getByRole("heading", { name: /coming soon/i })).toBeVisible();
  });
});
