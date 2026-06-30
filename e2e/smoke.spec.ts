import { test, expect } from "@playwright/test";

test.beforeEach(async ({ context }) => {
  // Bypass the age gate — these specs cover the post-confirmation shopping flow.
  await context.addCookies([
    { name: "age_confirmed", value: "1", url: "http://localhost:3003" },
  ]);
});

test("home renders the store name and a product link", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/.+/);
  await expect(page.getByText(/Elemental Peptides/i).first()).toBeVisible();
  await expect(page.locator('a[href^="/products/"]').first()).toBeVisible();
});

test("products page lists products", async ({ page }) => {
  await page.goto("/products");
  await expect(page.locator('a[href^="/products/"]').first()).toBeVisible();
});

test("a product detail page renders (navigated from /products)", async ({ page }) => {
  await page.goto("/products");
  // Grab the first product href from the listing, then navigate directly
  // to avoid a hydration-before-click race on cold dev-server start.
  const link = page.locator('a[href^="/products/"]').first();
  await expect(link).toBeVisible();
  const href = (await link.getAttribute("href"))!;
  await page.goto(href);
  await expect(page).toHaveURL(/\/products\/.+/);
  await expect(page.locator("h1, h2").first()).toBeVisible();
});

test("cart page renders", async ({ page }) => {
  await page.goto("/cart");
  await expect(page.getByText(/cart/i).first()).toBeVisible();
});

test("login page renders a form", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator('input[type="email"], input[type="password"]').first()).toBeVisible();
});
