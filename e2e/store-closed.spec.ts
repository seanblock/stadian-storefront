import { test, expect } from "@playwright/test";

// Run via: npm run test:closed  (sets STORE_CLOSED_OVERRIDE=coming_soon)
test("closed store shows the coming-soon sign and no storefront chrome", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Coming soon." })).toBeVisible();
  await expect(
    page.getByText("We're putting the finishing touches on our store. Check back soon.")
  ).toBeVisible();
  // No product links / shopping chrome while closed.
  await expect(page.locator('a[href^="/products/"]')).toHaveCount(0);
});

test("every route falls back to the closed sign while closed", async ({ page }) => {
  await page.goto("/products");
  await expect(page.getByRole("heading", { name: "Coming soon." })).toBeVisible();
});

test("a closed store renders only the closed sign, not the page behind it", async ({ request }) => {
  const html = await (await request.get("/products")).text();
  expect(html).toContain("Coming soon.");
  // Unlike the age gate, which overlays the real page, closed replaces it.
  expect(html).not.toMatch(/<footer\b/);
  expect(html).not.toContain('href="/products/');
  // Not just unrendered: product data must not reach the page's hidden payload.
  expect(html).not.toContain('\\"slug\\"');
});
