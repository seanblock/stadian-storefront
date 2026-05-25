import { HttpClient } from "./client";
import { PaymentsResource } from "./resources/payments";
import type { CheckoutFlowResponse, PaginatedList, StoreConfig, StorefrontBranding, StorefrontCart, StorefrontCommission, StorefrontCustomerProfile, StorefrontFaqResponse, StorefrontIntakeForm, StorefrontIntakeSubmission, StorefrontLoginResponse, StorefrontOrder, StorefrontPageResponse, StorefrontPayout, StorefrontProduct, StorefrontProductDetail, StorefrontProductGroup, StorefrontRefreshResponse, StorefrontWebhookSubscription } from "./types";
export * from "./types";
export * from "./errors";
export { HttpClient } from "./client";
export type { HttpClientConfig, RequestOptions } from "./client";
export { PaymentsResource } from "./resources/payments";
export { PaymentForm } from "./payment-form";
export type { PaymentFormContainerIds, TokenizeResult } from "./payment-form";
export interface CatalogListParams {
    page?: number;
    limit?: number;
    search?: string;
    category_id?: string;
}
export interface ProductGroupListParams {
    page?: number;
    limit?: number;
}
export interface CartSessionParams {
    sessionToken: string;
}
export interface AddCartItemParams {
    sessionToken: string;
    productId: string;
    quantity: number;
}
export interface UpdateCartItemParams {
    sessionToken: string;
    itemId: string;
    quantity: number;
}
export interface RemoveCartItemParams {
    sessionToken: string;
    itemId: string;
}
export interface CheckoutCreateParams {
    sessionToken: string;
    customerEmail?: string;
    shippingAddress?: Record<string, unknown>;
    billingAddress?: Record<string, unknown>;
    notes?: string;
    paymentMethod?: string;
    paymentReference?: string;
    paymentToken?: string;
    paymentType?: "card" | "ach";
    paymentFlow?: "embedded" | "redirect";
    storedPaymentMethodId?: string;
    savePaymentMethod?: boolean;
}
export interface IntakeSubmitParams {
    intakeFormId: string;
    responses: Record<string, unknown>;
    customerToken: string;
    productId?: string;
    orderId?: string;
}
export interface CustomerRegisterParams {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
}
export interface CustomerLoginParams {
    email: string;
    password: string;
}
export interface CustomerMeParams {
    customerToken: string;
}
export interface WebhookCreateParams {
    url: string;
    events: string[];
}
declare class CatalogResource {
    private http;
    constructor(http: HttpClient);
    /** List active storefront products with optional filtering/pagination. */
    list(params?: CatalogListParams): Promise<PaginatedList<StorefrontProduct>>;
    /** Get a single product by slug. */
    get(slug: string): Promise<StorefrontProductDetail>;
}
declare class CartResource {
    private http;
    constructor(http: HttpClient);
    /** Get or create the cart for the given session. */
    get(params: CartSessionParams): Promise<StorefrontCart>;
    /** Add a product to the cart. */
    addItem(params: AddCartItemParams): Promise<StorefrontCart>;
    /** Update quantity of a cart item. */
    updateItem(params: UpdateCartItemParams): Promise<StorefrontCart>;
    /** Remove an item from the cart. */
    removeItem(params: RemoveCartItemParams): Promise<StorefrontCart>;
}
declare class CheckoutResource {
    private http;
    constructor(http: HttpClient);
    /** Create an order from the current cart session. */
    create(params: CheckoutCreateParams): Promise<StorefrontOrder>;
    /** Get the checkout flow steps required for the current cart. */
    getFlow(sessionToken: string, shippingState: string): Promise<CheckoutFlowResponse>;
}
declare class OrdersResource {
    private http;
    constructor(http: HttpClient);
    /** List orders for the authenticated customer. */
    list(params: {
        customerToken: string;
        limit?: number;
        offset?: number;
    }): Promise<PaginatedList<StorefrontOrder>>;
    /** Get an order by ID. Requires customer authentication. */
    get(params: {
        orderId: string;
        customerToken: string;
    }): Promise<StorefrontOrder>;
}
declare class IntakeResource {
    private http;
    constructor(http: HttpClient);
    /** Get the intake form associated with a product. */
    getForm(productId: string): Promise<StorefrontIntakeForm>;
    /** Submit an intake form. Requires customer authentication. */
    submit(params: IntakeSubmitParams): Promise<StorefrontIntakeSubmission>;
    /** Get intake submission status. */
    getStatus(submissionId: string): Promise<StorefrontIntakeSubmission>;
}
declare class CustomersResource {
    private http;
    constructor(http: HttpClient);
    /** Register a new customer account. */
    register(params: CustomerRegisterParams): Promise<StorefrontCustomerProfile>;
    /** Authenticate a customer and receive tokens. */
    login(params: CustomerLoginParams): Promise<StorefrontLoginResponse>;
    /** Exchange a refresh token for a new access + refresh token pair. */
    refreshToken(params: {
        refreshToken: string;
    }): Promise<StorefrontRefreshResponse>;
    /** Get the authenticated customer's profile. */
    me(params: CustomerMeParams): Promise<StorefrontCustomerProfile>;
    /** Update the authenticated customer's profile. */
    update(params: {
        customerToken: string;
        firstName?: string;
        lastName?: string;
        phone?: string;
    }): Promise<StorefrontCustomerProfile>;
    /** Change the authenticated customer's password. */
    changePassword(params: {
        customerToken: string;
        currentPassword: string;
        newPassword: string;
    }): Promise<{
        ok: boolean;
    }>;
    /** Request a password-reset email. */
    forgotPassword(params: {
        email: string;
    }): Promise<{
        ok: boolean;
    }>;
    /** Reset a customer's password using the emailed token. */
    resetPassword(params: {
        token: string;
        newPassword: string;
    }): Promise<{
        ok: boolean;
    }>;
    /** Verify a customer's email address using the emailed token. */
    verifyEmail(params: {
        token: string;
    }): Promise<{
        ok: boolean;
    }>;
    /** List commissions earned by the authenticated affiliate customer. */
    commissions(params: {
        customerToken: string;
        status?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        items: StorefrontCommission[];
    }>;
    /** List payouts for the authenticated affiliate customer. */
    payouts(params: {
        customerToken: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        items: StorefrontPayout[];
    }>;
}
declare class BrandingResource {
    private http;
    constructor(http: HttpClient);
    /** Get the storefront branding configuration. */
    get(): Promise<StorefrontBranding>;
}
declare class PagesResource {
    private http;
    constructor(http: HttpClient);
    /** Get the About Us page content (Tiptap JSON document). */
    about(): Promise<StorefrontPageResponse>;
    /** Get the Terms of Service page content (Tiptap JSON document). */
    terms(): Promise<StorefrontPageResponse>;
    /** Get the Privacy Policy page content (Tiptap JSON document). */
    privacy(): Promise<StorefrontPageResponse>;
    /** Get the Return Policy page content (Tiptap JSON document). */
    returns(): Promise<StorefrontPageResponse>;
    /** Get the FAQ items. */
    faq(): Promise<StorefrontFaqResponse>;
}
declare class WebhooksResource {
    private http;
    constructor(http: HttpClient);
    /** List active webhook subscriptions. */
    list(): Promise<{
        items: StorefrontWebhookSubscription[];
    }>;
    /** Create a new webhook subscription. */
    create(params: WebhookCreateParams): Promise<StorefrontWebhookSubscription>;
    /** Delete a webhook subscription. */
    delete(subscriptionId: string): Promise<{
        ok: boolean;
    }>;
}
declare class ProductGroupsResource {
    private http;
    constructor(http: HttpClient);
    /** List active product groups with member products and pricing. */
    list(params?: ProductGroupListParams): Promise<PaginatedList<StorefrontProductGroup>>;
    /** Get a single product group by slug. */
    get(slug: string): Promise<StorefrontProductGroup>;
}
declare class ConfigResource {
    private http;
    constructor(http: HttpClient);
    /** Get the store configuration (feature flags, etc.). */
    get(): Promise<StoreConfig>;
}
export interface StadianClientConfig {
    apiKey: string;
    baseUrl: string;
    /** Maximum number of automatic retries on 429 / 5xx. Defaults to 3. */
    maxRetries?: number;
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
export declare class StadianClient {
    private readonly http;
    /** Product catalog. */
    readonly catalog: CatalogResource;
    /** Shopping cart. */
    readonly cart: CartResource;
    /** Checkout / order creation. */
    readonly checkout: CheckoutResource;
    /** Order retrieval. */
    readonly orders: OrdersResource;
    /** Intake forms and submissions. */
    readonly intake: IntakeResource;
    /** Customer registration, login, and profile. */
    readonly customers: CustomersResource;
    /** Storefront branding configuration. */
    readonly branding: BrandingResource;
    /** Storefront pages (About, Terms, Privacy, Returns) and FAQ. */
    readonly pages: PagesResource;
    /** Webhook subscriptions. */
    readonly webhooks: WebhooksResource;
    /** Product groups with member products. */
    readonly productGroups: ProductGroupsResource;
    /** Payment gateway config and stored payment methods. */
    readonly payments: PaymentsResource;
    /** Store configuration (feature flags). */
    readonly config: ConfigResource;
    constructor(config: StadianClientConfig);
}
