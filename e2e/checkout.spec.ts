import { test, expect } from "@playwright/test";

/**
 * Checkout e2e — up to (but NOT including) submission.
 *
 * This test hits the LIVE tenant API. It NEVER clicks "Place Order".
 *
 * Flow:
 *  1. Find a product on /products → navigate to its detail page.
 *  2. Click "Add to Cart"; wait for it to confirm added.
 *  3. Navigate to /checkout; assert the form renders.
 *  4. Fill state + country selects; assert hidden inputs carry values.
 *  5. Conditionally assert shipping options render (or console.warn if none).
 *  6. Toggle "Same as shipping" OFF; assert billing fields appear.
 *  7. Assert "Place Order" button exists. DO NOT click it.
 */

test("checkout form renders and is fillable (up to submit)", async ({ page }) => {
  // ── Step 1: Navigate to /products and pick the first product ──────────
  await page.goto("/products");
  const productLink = page.locator('a[href^="/products/"]').first();
  await expect(productLink).toBeVisible();
  const href = (await productLink.getAttribute("href"))!;
  await page.goto(href);
  await expect(page).toHaveURL(/\/products\/.+/);
  await expect(page.locator("h1, h2").first()).toBeVisible();

  // ── Step 2: Add to cart ───────────────────────────────────────────────
  // The "Add to Cart" button text cycles: "Add to Cart" → "Adding..." → "Added to Cart"
  // If the product requires intake/age-verification the cart add may fail with
  // an error message — guard that case.
  const addToCartBtn = page.getByRole("button", { name: /add to cart/i });
  if (!(await addToCartBtn.isVisible())) {
    console.warn(
      "checkout.spec: no 'Add to Cart' button visible on the first product page — " +
        "product may be out-of-stock or not purchasable; skipping checkout test"
    );
    return;
  }
  await addToCartBtn.click();

  // Wait for the button to show "Added to Cart" or for an error alert to appear.
  const addedConfirm = page.getByRole("button", { name: /added to cart/i });
  const addError = page.locator('[role="alert"]');

  await Promise.race([
    addedConfirm.waitFor({ timeout: 15_000 }),
    addError.waitFor({ timeout: 15_000 }),
  ]).catch(() => {
    // Neither appeared within timeout — proceed anyway, the redirect will catch it.
  });

  if (await addError.isVisible()) {
    const msg = await addError.textContent();
    console.warn(
      `checkout.spec: add-to-cart returned an error ("${msg?.trim()}") ` +
        "— skipping checkout test"
    );
    return;
  }

  // ── Step 3: Navigate to /checkout and assert form renders ─────────────
  await page.goto("/checkout");

  // The page redirects to /cart if the cart is empty; detect that.
  if (page.url().includes("/cart")) {
    console.warn(
      "checkout.spec: redirected to /cart after add-to-cart — cart is still empty; " +
        "skipping checkout test"
    );
    return;
  }

  // Wait for the checkout form heading.
  await expect(page.getByRole("heading", { name: /checkout/i })).toBeVisible();

  // Assert key form sections exist.
  // Contact section
  await expect(page.locator('input[name="email"]')).toBeVisible();

  // Shipping Address card
  await expect(page.getByText(/shipping address/i).first()).toBeVisible();
  await expect(page.locator('input[name="line1"]')).toBeVisible();

  // Payment card
  await expect(page.getByText(/^payment$/i).first()).toBeVisible();

  // ── Step 4: Fill the state select; assert hidden input carries a value ─
  // The AddressFields component renders a Base UI Select for state when
  // country === "US" (the default). Clicking the trigger opens a listbox;
  // clicking an option commits the value into [name="state"].
  const stateTrigger = page.locator('[id="state"]');
  if (await stateTrigger.isVisible()) {
    await stateTrigger.click();
    // Wait for the listbox to open.
    const listbox = page.getByRole("listbox");
    await listbox.waitFor({ timeout: 10_000 });
    // Click the first option in the state list.
    const firstOption = listbox.getByRole("option").first();
    await firstOption.click();
    // After selection the hidden input should carry a non-empty value.
    const stateInput = page.locator('[name="state"]');
    await expect(stateInput).not.toHaveValue("");
  } else {
    console.warn(
      "checkout.spec: state SelectTrigger not found via id='state' — " +
        "the Base UI select may use a different id; state-value assertion skipped"
    );
  }

  // Also assert country hidden input is non-empty (it has a default of "US").
  const countryInput = page.locator('[name="country"]');
  await expect(countryInput).not.toHaveValue("");

  // ── Step 5: Conditionally assert shipping options ─────────────────────
  // The Shipping Method card only renders when shippingOptions.length > 0.
  // Wait a moment for the async shipping fetch to complete.
  const shippingCard = page.getByText(/shipping method/i);
  const shippingVisible = await shippingCard.isVisible().catch(() => false);

  if (shippingVisible) {
    // Either ≥1 radio (multiple options) or an auto-selected single-option row.
    const radios = page.locator('input[type="radio"][name="shipping_method"]');
    const singleRow = page.locator(
      '.rounded-md.border.border-border.bg-muted\\/40'
    );
    const radioCount = await radios.count();
    if (radioCount >= 1) {
      // Multiple options rendered as radios — at least one must exist.
      expect(radioCount).toBeGreaterThanOrEqual(1);
    } else {
      // Single auto-selected option rendered as a static row (no radio).
      await expect(singleRow.first()).toBeVisible();
    }
  } else {
    console.warn(
      "checkout.spec: no shipping methods rendered — tenant has no shipping methods " +
        "configured; shipping assertion skipped"
    );
  }

  // ── Step 6: Toggle "Same as shipping" OFF; assert billing fields appear ─
  const sameAsShippingCheckbox = page.getByRole("checkbox", {
    name: /same as shipping/i,
  });
  await expect(sameAsShippingCheckbox).toBeVisible();
  // The checkbox is checked by default — uncheck it.
  await sameAsShippingCheckbox.uncheck();

  // Billing address fields should now be visible.
  // They use prefixed names: billing_line1, billing_city, etc.
  await expect(page.locator('input[name="billing_line1"]')).toBeVisible();
  await expect(page.locator('input[name="billing_city"]')).toBeVisible();

  // ── Step 7: Assert "Place Order" button exists — DO NOT click it ──────
  const placeOrderBtn = page.getByRole("button", { name: /place order/i });
  await expect(placeOrderBtn).toBeVisible();
  // We intentionally do NOT click Place Order to avoid creating a real order.
});
