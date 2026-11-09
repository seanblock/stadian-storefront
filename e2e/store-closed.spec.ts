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

// The age cookie is self-set, so it must not open anything on a closed store.
for (const cookie of [undefined, "age_confirmed=1"]) {
  test(`no route's hidden payload carries store content (${cookie ?? "no cookie"})`, async ({ request }) => {
    const headers = cookie ? { cookie } : undefined;
    // Product display names, not slugs: a slug in the URL is echoed back as a route param.
    const productNames = /Retatrutide|Ipamorelin|BPC-157|MOTS-c|Tirzepatide|CJC-1295|GHK-Cu|Tesamorelin/;
    const routes = [
      "/", "/products", "/products/retatrutide-20mg", "/cart", "/checkout", "/order/x", "/order-access",
      "/account", "/rep", "/faq", "/about", "/terms", "/privacy", "/returns", "/contact", "/login", "/register",
    ];
    for (const route of routes) {
      const html = await (await request.get(route, { headers })).text();
      expect(html, route).toContain("Coming soon.");
      expect(html, route).not.toMatch(productNames);
      expect(html, route).not.toContain("FAQPage"); // FAQ JSON-LD
      expect(html, route).not.toContain('\\"type\\":\\"doc\\"'); // CMS page body
      expect(html, route).not.toContain("Our standard"); // home page sections
    }

    const sitemap = await (await request.get("/sitemap.xml", { headers })).text();
    expect(sitemap).not.toContain("/products/");
  });
}
