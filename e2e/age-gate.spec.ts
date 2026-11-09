import { test, expect } from "@playwright/test";

// Needs a local tenant with the age gate on and the store open.
const GATE_TEXT = /You must be\s+\d+\s+or older to enter/;

test.describe("age gate", () => {
  test("covers the real page until the visitor confirms", async ({ page }) => {
    await page.goto("/about");

    const gate = page.getByRole("dialog");
    await expect(gate).toBeVisible();
    await expect(gate).toContainText(GATE_TEXT);
    // The page is rendered underneath, but can't be used yet.
    await expect(page.locator("main")).toBeAttached();
    await expect(page.locator('div[inert]').first()).toBeAttached();

    // Keyboard focus can't reach the page behind the gate.
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press("Tab");
      // Reported by tag so a failure names what focus escaped to.
      const escapedTo = await page.evaluate(() => {
        const active = document.activeElement;
        if (!active || active === document.body) return null;
        // Next's dev toolbar sits outside the app in `next dev` only.
        if (active.tagName === "NEXTJS-PORTAL") return null;
        return active.closest('[role="dialog"]') ? null : active.outerHTML.slice(0, 120);
      });
      expect(escapedTo).toBeNull();
    }

    await page.getByRole("button", { name: /or older$/ }).click();

    await expect(gate).toBeHidden();
    await expect(page.locator("div[inert]")).toHaveCount(0);
    await expect(page.locator("footer")).toBeVisible();
  });

  test("the confirmation is remembered", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /or older$/ }).click();
    await expect(page.getByRole("dialog")).toBeHidden();

    await page.goto("/products");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("scanners get each page's real content in the HTML", async ({ request }) => {
    const titles = new Map<string, string>();
    for (const path of ["/", "/about", "/terms", "/privacy", "/products"]) {
      const res = await request.get(path);
      expect(res.status()).toBe(200);
      const html = await res.text();
      // Server-rendered, not only in the client payload.
      expect(html).toMatch(/<main\b/);
      expect(html).toMatch(/<footer\b/);
      expect(html).toContain("application/ld+json");
      const body = html
        .slice(html.indexOf("<main"), html.indexOf("</main>"))
        .replace(/<script[\s\S]*?<\/script>/g, "");
      titles.set(path, body);
    }
    // Every URL used to return one identical interstitial.
    expect(new Set(titles.values()).size).toBe(titles.size);
  });
});
