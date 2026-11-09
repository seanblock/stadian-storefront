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
    const mainContentByPath = new Map<string, string>();
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
      mainContentByPath.set(path, body);
    }
    // Every URL used to return one identical interstitial.
    expect(new Set(mainContentByPath.values()).size).toBe(mainContentByPath.size);
  });

  test("products stay out of the page source until the visitor confirms", async ({
    page,
    context,
    baseURL,
    request,
  }) => {
    // A confirmed visitor opens a product, which gives a real name to look for.
    // Catalog links can be product groups that redirect, so read the final page.
    await context.addCookies([{ name: "age_confirmed", value: "1", url: baseURL! }]);
    await page.goto("/products");
    // Navigate directly to avoid a hydration-before-click race on a cold dev server.
    const href = await page.locator('main a[href^="/products/"]').first().getAttribute("href");
    await page.goto(href!);
    const heading = page.locator("main h1").first();
    await expect(heading).toBeVisible();
    const name = (await heading.textContent())?.trim() ?? "";
    const slug = new URL(page.url()).pathname.split("/").pop() ?? "";
    expect(name).toBeTruthy();
    expect(slug).toBeTruthy();

    // The `request` fixture has no cookies: this is what scanners get.
    for (const path of ["/", "/products", `/products/${slug}`, "/sitemap.xml", "/about", "/faq"]) {
      const source = await (await request.get(path)).text();
      if (path !== `/products/${slug}`) {
        expect(source, `slug in source of ${path}`).not.toContain(slug);
      }
      expect(source, `name in source of ${path}`).not.toContain(name);
    }

    const lockedDetail = await (await request.get(`/products/${slug}`)).text();
    expect(lockedDetail).toContain("Confirm your age to view the catalog.");
    expect(lockedDetail).toMatch(/<meta name="robots" content="noindex/);
  });

  test("nothing behind the gate spends a verification link or creates a cart", async ({ page }) => {
    // Server action calls with their arguments. The signed-in profile read takes
    // none and only reads; verifying an email or loading a cart takes arguments.
    const actionArgs: string[] = [];
    page.on("request", (req) => {
      if (req.method() === "POST" && req.headers()["next-action"]) {
        actionArgs.push(req.postData() ?? "");
      }
    });

    await page.goto("/verify-email?token=not-a-real-token");
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText("Verifying your email...")).toBeVisible();
    await page.waitForTimeout(1500);
    expect(actionArgs.filter((args) => args !== "[]"), "actions with arguments behind the gate").toEqual([]);

    // The same page once confirmed does verify, which proves the check is live.
    await page.getByRole("button", { name: /or older$/ }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect.poll(() => actionArgs.some((args) => args.includes("not-a-real-token"))).toBe(true);
  });
});
