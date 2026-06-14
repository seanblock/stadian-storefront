import { HttpClient } from "./client";
import { PaymentsResource } from "./resources/payments";
// Re-export everything consumers need
export * from "./types";
export * from "./errors";
export { HttpClient } from "./client";
export { PaymentsResource } from "./resources/payments";
export { PaymentForm } from "./payment-form";
// ---------------------------------------------------------------------------
// Resource classes
// ---------------------------------------------------------------------------
class CatalogResource {
    http;
    constructor(http) {
        this.http = http;
    }
    /** List active storefront products with optional filtering/pagination. */
    list(params) {
        return this.http.request("GET", "/products", {
            query: params
                ? {
                    page: params.page,
                    limit: params.limit,
                    search: params.search,
                    category_id: params.category_id,
                }
                : undefined,
        });
    }
    /** Get a single product by slug. */
    get(slug) {
        return this.http.request("GET", `/products/${encodeURIComponent(slug)}`);
    }
}
class CartResource {
    http;
    constructor(http) {
        this.http = http;
    }
    /** Get or create the cart for the given session. */
    get(params) {
        return this.http.request("GET", "/cart", {
            headers: { "X-Session-ID": params.sessionToken },
        });
    }
    /** Add a product to the cart. */
    addItem(params) {
        return this.http.request("POST", "/cart/items", {
            headers: { "X-Session-ID": params.sessionToken },
            body: {
                product_id: params.productId,
                quantity: params.quantity,
            },
        });
    }
    /** Update quantity of a cart item. */
    updateItem(params) {
        return this.http.request("PUT", `/cart/items/${encodeURIComponent(params.itemId)}`, {
            headers: { "X-Session-ID": params.sessionToken },
            body: { quantity: params.quantity },
        });
    }
    /** Remove an item from the cart. */
    removeItem(params) {
        return this.http.request("DELETE", `/cart/items/${encodeURIComponent(params.itemId)}`, {
            headers: { "X-Session-ID": params.sessionToken },
        });
    }
}
class CheckoutResource {
    http;
    constructor(http) {
        this.http = http;
    }
    /** Create an order from the current cart session. */
    create(params) {
        return this.http.request("POST", "/checkout", {
            body: {
                session_token: params.sessionToken,
                customer_email: params.customerEmail,
                shipping_address: params.shippingAddress,
                billing_address: params.billingAddress,
                notes: params.notes,
                payment_method: params.paymentMethod,
                payment_reference: params.paymentReference,
                payment_token: params.paymentToken,
                payment_type: params.paymentType,
                payment_flow: params.paymentFlow,
                stored_payment_method_id: params.storedPaymentMethodId,
                save_payment_method: params.savePaymentMethod,
            },
        });
    }
    /** Get the checkout flow steps required for the current cart. */
    getFlow(sessionToken, shippingState) {
        return this.http.request("POST", "/checkout/flow", {
            body: {
                session_token: sessionToken,
                shipping_state: shippingState,
            },
        });
    }
}
class OrdersResource {
    http;
    constructor(http) {
        this.http = http;
    }
    /** List orders for the authenticated customer. */
    list(params) {
        return this.http.request("GET", "/orders", {
            headers: { Authorization: `Bearer ${params.customerToken}` },
            query: { limit: params.limit, offset: params.offset },
        });
    }
    /** Get an order by ID. Requires customer authentication. */
    get(params) {
        return this.http.request("GET", `/orders/${encodeURIComponent(params.orderId)}`, {
            headers: { Authorization: `Bearer ${params.customerToken}` },
        });
    }
}
class IntakeResource {
    http;
    constructor(http) {
        this.http = http;
    }
    /** Get the intake form associated with a product. */
    getForm(productId) {
        return this.http.request("GET", `/intake-forms/${encodeURIComponent(productId)}`);
    }
    /** Submit an intake form. Requires customer authentication. */
    submit(params) {
        return this.http.request("POST", "/intake-submissions", {
            headers: { Authorization: `Bearer ${params.customerToken}` },
            body: {
                intake_form_id: params.intakeFormId,
                responses: params.responses,
                product_id: params.productId,
                order_id: params.orderId,
            },
        });
    }
    /** Get intake submission status. */
    getStatus(submissionId) {
        return this.http.request("GET", `/intake-submissions/${encodeURIComponent(submissionId)}`);
    }
}
class CustomersResource {
    http;
    constructor(http) {
        this.http = http;
    }
    /** Register a new customer account. */
    register(params) {
        return this.http.request("POST", "/customers/register", {
            body: {
                email: params.email,
                password: params.password,
                first_name: params.firstName,
                last_name: params.lastName,
                phone: params.phone,
            },
        });
    }
    /** Authenticate a customer and receive tokens. */
    login(params) {
        return this.http.request("POST", "/customers/login", {
            body: {
                email: params.email,
                password: params.password,
            },
        });
    }
    /** Exchange a refresh token for a new access + refresh token pair. */
    refreshToken(params) {
        return this.http.request("POST", "/customers/refresh", { body: { refresh_token: params.refreshToken } });
    }
    /** Get the authenticated customer's profile. */
    me(params) {
        return this.http.request("GET", "/customers/me", {
            headers: { Authorization: `Bearer ${params.customerToken}` },
        });
    }
    /** Update the authenticated customer's profile. */
    update(params) {
        return this.http.request("PATCH", "/customers/me", {
            headers: { Authorization: `Bearer ${params.customerToken}` },
            body: {
                first_name: params.firstName,
                last_name: params.lastName,
                phone: params.phone,
            },
        });
    }
    /** Change the authenticated customer's password. */
    changePassword(params) {
        return this.http.request("POST", "/customers/change-password", {
            headers: { Authorization: `Bearer ${params.customerToken}` },
            body: {
                current_password: params.currentPassword,
                new_password: params.newPassword,
            },
        });
    }
    /** Request a password-reset email. */
    forgotPassword(params) {
        return this.http.request("POST", "/customers/forgot-password", { body: params });
    }
    /** Reset a customer's password using the emailed token. */
    resetPassword(params) {
        return this.http.request("POST", "/customers/reset-password", { body: { token: params.token, new_password: params.newPassword } });
    }
    /** Verify a customer's email address using the emailed token. */
    verifyEmail(params) {
        return this.http.request("POST", "/customers/verify-email", { body: params });
    }
    /** List commissions earned by the authenticated affiliate customer. */
    commissions(params) {
        return this.http.request("GET", "/customers/commissions", {
            headers: { Authorization: `Bearer ${params.customerToken}` },
            query: {
                status: params.status,
                limit: params.limit,
                offset: params.offset,
            },
        });
    }
    /** List payouts for the authenticated affiliate customer. */
    payouts(params) {
        return this.http.request("GET", "/customers/payouts", {
            headers: { Authorization: `Bearer ${params.customerToken}` },
            query: { limit: params.limit, offset: params.offset },
        });
    }
}
class BrandingResource {
    http;
    constructor(http) {
        this.http = http;
    }
    /** Get the storefront branding configuration. */
    get() {
        return this.http.request("GET", "/branding");
    }
}
class PagesResource {
    http;
    constructor(http) {
        this.http = http;
    }
    /** Get the About Us page content (Tiptap JSON document). */
    about() {
        return this.http.request("GET", "/pages/about");
    }
    /** Get the Terms of Service page content (Tiptap JSON document). */
    terms() {
        return this.http.request("GET", "/pages/terms");
    }
    /** Get the Privacy Policy page content (Tiptap JSON document). */
    privacy() {
        return this.http.request("GET", "/pages/privacy");
    }
    /** Get the Return Policy page content (Tiptap JSON document). */
    returns() {
        return this.http.request("GET", "/pages/returns");
    }
    /** Get the FAQ items. */
    faq() {
        return this.http.request("GET", "/faq");
    }
}
class WebhooksResource {
    http;
    constructor(http) {
        this.http = http;
    }
    /** List active webhook subscriptions. */
    list() {
        return this.http.request("GET", "/webhooks");
    }
    /** Create a new webhook subscription. */
    create(params) {
        return this.http.request("POST", "/webhooks", {
            body: {
                url: params.url,
                events: params.events,
            },
        });
    }
    /** Delete a webhook subscription. */
    delete(subscriptionId) {
        return this.http.request("DELETE", `/webhooks/${encodeURIComponent(subscriptionId)}`);
    }
}
class ProductGroupsResource {
    http;
    constructor(http) {
        this.http = http;
    }
    /** List active product groups with member products and pricing. */
    list(params) {
        return this.http.request("GET", "/product-groups", {
            query: params
                ? { page: params.page, limit: params.limit }
                : undefined,
        });
    }
    /** Get a single product group by slug. */
    get(slug) {
        return this.http.request("GET", `/product-groups/${encodeURIComponent(slug)}`);
    }
}
class ConfigResource {
    http;
    constructor(http) {
        this.http = http;
    }
    /** Get the store configuration (feature flags, etc.). */
    get() {
        return this.http.request("GET", "/config");
    }
}
/**
 * Stadian Storefront SDK client.
 *
 * ```ts
 * const client = new StadianClient({
 *   apiKey: "sk_live_...",
 *   baseUrl: "https://api.example.com",
 * });
 *
 * const products = await client.catalog.list({ page: 1, limit: 10 });
 * ```
 */
export class StadianClient {
    http;
    /** Product catalog. */
    catalog;
    /** Shopping cart. */
    cart;
    /** Checkout / order creation. */
    checkout;
    /** Order retrieval. */
    orders;
    /** Intake forms and submissions. */
    intake;
    /** Customer registration, login, and profile. */
    customers;
    /** Storefront branding configuration. */
    branding;
    /** Storefront pages (About, Terms, Privacy, Returns) and FAQ. */
    pages;
    /** Webhook subscriptions. */
    webhooks;
    /** Product groups with member products. */
    productGroups;
    /** Payment gateway config and stored payment methods. */
    payments;
    /** Store configuration (feature flags). */
    config;
    constructor(config) {
        this.http = new HttpClient({
            apiKey: config.apiKey,
            baseUrl: config.baseUrl,
            maxRetries: config.maxRetries,
            timeoutMs: config.timeoutMs,
        });
        this.catalog = new CatalogResource(this.http);
        this.cart = new CartResource(this.http);
        this.checkout = new CheckoutResource(this.http);
        this.orders = new OrdersResource(this.http);
        this.intake = new IntakeResource(this.http);
        this.customers = new CustomersResource(this.http);
        this.branding = new BrandingResource(this.http);
        this.pages = new PagesResource(this.http);
        this.webhooks = new WebhooksResource(this.http);
        this.productGroups = new ProductGroupsResource(this.http);
        this.payments = new PaymentsResource(this.http);
        this.config = new ConfigResource(this.http);
    }
}
