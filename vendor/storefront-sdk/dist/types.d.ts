export interface PaginatedList<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
}
export interface StorefrontCategory {
    name: string;
    slug: string;
    color: string;
}
export interface StorefrontGroupProduct {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    form_type: string | null;
    dosage: string | null;
    image_url: string | null;
    default_price: number | null;
    categories: StorefrontCategory[];
    requires_intake: boolean;
    /** False only when this variant is tracked and has nothing available. */
    in_stock: boolean;
    /** Units available now. Null means inventory isn't tracked. */
    available_quantity: number | null;
}
export interface StorefrontProductGroup {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    image_url: string | null;
    product_count: number;
    products: StorefrontGroupProduct[];
    /** False only when every variant in the group is sold out. */
    in_stock: boolean;
}
export interface StorefrontProduct {
    /** True when a saved COA is available to this customer. */
    has_coa?: boolean;
    id: string;
    name: string;
    slug: string;
    description: string | null;
    form_type: string | null;
    image_url: string | null;
    price: number | null;
    compare_at_price: number | null;
    categories: StorefrontCategory[];
    requires_intake?: boolean;
    badges: StorefrontBadge[];
    /** False only when the product is inventory-tracked and has nothing available. */
    in_stock: boolean;
    /** Units available now. Null means inventory isn't tracked — no cap applies. */
    available_quantity: number | null;
    min_order_quantity?: number;
    max_order_quantity?: number | null;
}
export interface StorefrontVariant {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    image_url: string | null;
}
export interface StorefrontVolumeTier {
    min_quantity: number;
    max_quantity: number | null;
    discount_type: string | null;
    discount_value: number | null;
    label: string | null;
}
export interface StorefrontProductDetail extends StorefrontProduct {
    currency: string;
    min_order_quantity: number;
    max_order_quantity: number | null;
    discountable: boolean;
    taxable: boolean;
    volume_tiers: StorefrontVolumeTier[];
    variants: StorefrontVariant[];
    intake_form_id: string | null;
    trust_signals: StorefrontTrustSignal[];
    reviews: StorefrontReview[];
    review_summary: StorefrontReviewSummary | null;
    dynamic_fields: Record<string, unknown> | null;
    field_schema: StorefrontFieldGroup[];
    subscription: StorefrontSubscriptionConfig | null;
    /**
     * Certificates of analysis to show: the in-stock lots' batch certificates,
     * else the product-level fallback. Prefer this over coa_document_url/documents.
     */
    certificates?: StorefrontCertificate[];
    /** Public URL of the product's certificate of analysis PDF, if published. */
    coa_document_url: string | null;
    /** Additional public product documents (datasheets etc.). */
    documents: StorefrontProductDocument[];
}
export interface StorefrontCertificate {
    /** Opens in a new tab. */
    url: string;
    /** Display label, e.g. "Certificate of Analysis — Lot 24A". */
    name: string;
    /** "lot": one production batch's certificate. "product": the product-level fallback, not tied to a batch. */
    source: "lot" | "product";
    lot_number?: string | null;
}

export interface StorefrontProductDocument {
    url: string;
    name?: string;
    [key: string]: unknown;
}
export interface StorefrontFieldDef {
    slug: string;
    name: string;
    field_type: string;
    options: Record<string, unknown> | null;
}
export interface StorefrontFieldGroup {
    name: string;
    slug: string;
    icon: string | null;
    fields: StorefrontFieldDef[];
}
export interface StorefrontReview {
    id: string;
    rating: number;
    title: string | null;
    body: string | null;
    admin_response: string | null;
    created_at: string;
}
export interface StorefrontReviewSummary {
    average_rating: number;
    total_count: number;
}
export interface StorefrontLineDiscount {
    kind: "volume" | "promotion" | "code" | "affiliate";
    /** e.g. "Qty 50+ · 20% off", a promotion's name, "Code SAVE10". */
    label: string;
    amount: number;
}
export interface StorefrontCartItem {
    id: string;
    product_id: string;
    product_name: string;
    product_slug: string;
    image_url: string | null;
    quantity: number;
    unit_price: number;
    line_total: number;
    /** Before any discount (list price × qty). */
    line_subtotal?: number | null;
    /** After every discount — what the order charges for this line. */
    net_line_total?: number | null;
    /** What each discount on this line is for, and how much it took off. */
    discounts?: StorefrontLineDiscount[];
  available_quantity?: number | null;
  min_order_quantity?: number;
  max_order_quantity?: number | null;
}
export interface StorefrontCart {
    id: string;
    items: StorefrontCartItem[];
    subtotal: number;
    discount_amount: number;
    /** discount_amount broken out by source (quantity tiers, promotion, code). */
    discounts?: StorefrontLineDiscount[];
    tax_amount: number;
    total: number;
    promotion_code: string | null;
    /** The affiliate/discount code the shopper entered (when the discount came from a DiscountCode). */
    discount_code?: string | null;
    free_shipping?: boolean;
}
export interface StorefrontOrderItem {
    id: string;
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    line_total: number;
    /** Certificates for the batches this line shipped from, else the product-level certificate. */
    certificates?: StorefrontCertificate[];
}
export interface StorefrontShippingAddress {
    first_name?: string;
    last_name?: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
}
export interface StorefrontOrder {
  refunded_at?: string | null;
  refund_amount?: number;
  refund_status?: string;
    id: string;
    order_number: string | null;
    status: string;
    /** The offline method the buyer chose ("zelle", "ach", …), when there was
     *  one. Needed to show them how to pay while the order awaits payment. */
    payment_method?: string | null;
    subtotal: number;
    discount_amount: number;
    tax_amount: number;
    total: number;
    tracking_number: string | null;
    tracking_url: string | null;
    created_at: string;
    payment_status?: string | null;
    payment_error?: string | null;
    redirect_url?: string | null;
    shipping_amount?: number;
    processing_fee?: number;
    items?: StorefrontOrderItem[];
    shipping_address?: StorefrontShippingAddress | null;
  tracking_numbers?: Array<{ tracking_number: string; carrier?: string | null }>;
}
export interface StorefrontIntakeForm {
    id: string;
    name: string;
    description: string | null;
    fields: Record<string, unknown>[];
    product_id: string | null;
}
export interface StorefrontIntakeSubmission {
    id: string;
    intake_form_id: string;
    status: string;
    created_at: string;
    updated_at: string;
}
export interface StorefrontCustomerProfile {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    created_at: string;
    customer_type?: 'individual' | 'business';
    company_name?: string | null;
    /** 'pending' means the account is awaiting admin approval and cannot sign in yet. */
    account_status?: 'active' | 'pending' | 'rejected';
    affiliate_code: string | null;
    affiliate_link_slug: string | null;
    commission_rate: number | null;
    affiliate_status: string | null;
    /** True when the user's role allows placing orders on behalf of customers
     *  (unlocks the sales-rep / POS surface). */
    is_sales_rep?: boolean;
    /** Session issued by registration itself, so a storefront never has to call
     *  login straight afterwards — for a Turnstile tenant that second call would
     *  have no valid challenge to present. Null on approval-mode stores, where a
     *  "pending" account may not hold a token. */
    access_token?: string | null;
    refresh_token?: string | null;
}
export interface RepCustomer {
    id: string;
    email: string;
    name: string | null;
    phone: string | null;
    customer_type: 'individual' | 'business';
    company_name: string | null;
    account_status: 'active' | 'pending' | 'rejected';
    created_at: string;
    /** Most recent order's ship-to (single-customer endpoint only) — POS prefill. */
    last_ship_to?: Record<string, unknown> | null;
    /** Assigned to the calling rep (vs an unclaimed house account). */
    is_mine?: boolean;
    /** Orders THIS rep placed for them — never another rep's. */
    order_count?: number;
    total_spent?: number;
    last_order_at?: string | null;
}
export interface RepCustomersResponse {
    items: RepCustomer[];
    has_more: boolean;
}
export interface RepCheckoutResponse extends StorefrontOrder {
    /** Durable pay-by-link URL (link-capable gateways only). */
    payment_link_url?: string | null;
    payment_link_email_sent?: boolean;
}
export interface RepOrderItem {
    product_id: string;
    product_name: string | null;
    quantity: number;
    unit_price: number;
    line_total: number;
  product_slug?: string | null;
  has_coa?: boolean;
    /** Certificates for the batches this line shipped from, else the product-level certificate. */
    certificates?: StorefrontCertificate[];
}
export interface RepOrderSummary {
  refunded_at?: string | null;
  refund_amount?: number;
  refund_status?: string;
    id: string;
    order_number: string | null;
    status: string;
    customer_id: string;
    customer_name: string | null;
    customer_email: string | null;
    subtotal: number;
    discount_amount: number;
    tax_amount: number;
    shipping_amount: number;
    total: number;
    payment_method: string | null;
    payment_link_url: string | null;
    payment_link_status: string | null;
    created_at: string;
    items: RepOrderItem[];
  shipping_address?: StorefrontShippingAddress | null;
  processing_fee?: number;
  tracking_numbers?: Array<{ tracking_number: string; carrier?: string | null }>;
}
export interface RepOrdersResponse {
    items: RepOrderSummary[];
    has_more: boolean;
}
export interface RepPeriodStats {
    count: number;
    revenue: number;
}
export interface RepDashboard {
    today: RepPeriodStats;
    this_week: RepPeriodStats;
    this_month: RepPeriodStats;
    all_time: RepPeriodStats;
    commissions: {
        pending: number;
        approved: number;
        paid: number;
        /** Commission on this rep's orders that have not been paid yet. */
        unrealized?: number;
        unrealized_order_count?: number;
    };
    commission_rate: number | null;
    commission_active?: boolean;
}
export interface StorefrontLoginResponse {
    access_token: string;
    refresh_token: string;
    customer: StorefrontCustomerProfile;
}
export interface StorefrontRefreshResponse {
    access_token: string;
    refresh_token: string;
}
export interface StorefrontBadge {
    label: string;
    color_token: string;
    icon_name: string | null;
}
export interface StorefrontTrustSignal {
    title: string;
    description: string | null;
    icon_name: string | null;
    link_url: string | null;
    link_text: string | null;
}
export interface StorefrontFaqItem {
    question: string;
    answer: string;
}
export interface StorefrontBranding {
    store_name: string | null;
    tagline: string | null;
    logo_url: string | null;
    primary_color: string | null;
    accent_color: string | null;
    mode: string | null;
    social_links: Record<string, string> | null;
    footer_text: string | null;
    about_us: Record<string, unknown> | null;
    faq: StorefrontFaqItem[] | null;
    terms_of_service: Record<string, unknown> | null;
    privacy_policy: Record<string, unknown> | null;
    return_policy: Record<string, unknown> | null;
    storefront_enabled: boolean;
    storefront_closed_reason: 'general' | 'coming_soon' | 'maintenance' | null;
    /** True when a preview password is set, so the closed-store page can show the unlock form. */
    storefront_access_password_set?: boolean;
    age_gate_enabled?: boolean;
    age_gate_min_age?: number;
    age_gate_redirect_url?: string | null;
    /** Public Turnstile site key for this tenant's own Cloudflare widget. Null
     *  when the merchant hasn't configured bot protection — the storefront then
     *  renders no challenge and the API requires none. */
    turnstile_site_key?: string | null;
    /** B2B: checkout is closed to guests — shoppers must sign in to order. */
    require_login_to_checkout?: boolean;
    /** B2B: prices and the cart are only available to signed-in account holders. */
    hide_prices_until_login?: boolean;
    /** How shoppers get an account on this store. */
    registration_mode?: StorefrontRegistrationMode;
    trust_signals?: StorefrontTrustSignal[];
    /** Lowest subtotal that ships free on an active shipping method; null when
     *  nothing ships free. Render "free shipping" copy from this, never hardcode it. */
    free_shipping_threshold?: number | null;
}
/**
 * open — anyone can register and order immediately.
 * approval — anyone can apply; an admin must approve before they can sign in.
 * invite_only — no public sign-up; the store creates accounts.
 */
export type StorefrontRegistrationMode = 'open' | 'approval' | 'invite_only';
export interface StorefrontPageResponse {
    /** Tiptap/ProseMirror JSON document tree. Render with your own components. */
    content: Record<string, unknown> | null;
}
export interface StorefrontFaqResponse {
    items: StorefrontFaqItem[];
}
export interface StorefrontCommission {
    id: string;
    affiliate_id: string;
    order_id: string;
    amount: number;
    rate: number;
    type: string;
    status: string;
    hold_until: string | null;
    approved_at: string | null;
    created_at: string;
}
export interface StorefrontPayout {
    id: string;
    affiliate_id: string;
    amount: number;
    method: string;
    status: string;
    reference: string | null;
    sent_at: string | null;
    created_at: string;
}
export interface StorefrontSubscriptionInterval {
    id: string;
    frequency_days: number;
    discount_percent: number;
    label: string | null;
}
export interface StorefrontSubscriptionConfig {
    enabled: boolean;
    intervals: StorefrontSubscriptionInterval[];
}
export interface StorefrontSubscription {
    id: string;
    status: 'active' | 'paused' | 'cancelled';
    frequency_days: number;
    discount_percent: number;
    next_order_date: string | null;
    items: StorefrontSubscriptionItem[];
    created_at: string;
}
export interface StorefrontSubscriptionItem {
    id: string;
    product_id: string;
    product_name: string;
    product_slug: string;
    quantity: number;
}
export interface CheckoutStep {
    step: "shipping_check" | "disclaimer" | "age_verification" | "intake" | "payment";
    type?: string;
    required: boolean;
    completed: boolean;
    title: string;
    description: string;
    intake_form_id?: string;
    products_requiring_intake?: string[];
    method?: string;
}
export interface BlockedProduct {
    product_id: string;
    reason: string;
}
export interface CheckoutFlowResponse {
    steps: CheckoutStep[];
    ready_to_checkout: boolean;
    blocked_products: BlockedProduct[];
}
export interface StorefrontWebhookSubscription {
    id: string;
    url: string;
    events: string[];
    secret: string;
    is_active: boolean;
    created_at: string;
}
export interface PaymentClientConfig {
    gateway_enabled: boolean;
    gateway_type: "nmi" | "authorizenet" | null;
    checkout_mode: "embedded" | "redirect";
    ach_enabled: boolean;
    js_library_url: string | null;
    public_key: string | null;
    form_config: Record<string, unknown>;
}
/**
 * A manual (offline) payment method the tenant accepts — Zelle, ACH, wire,
 * check, Venmo, Cash App. The customer picks one at checkout and receives
 * instructions by email; the order stays `pending_payment` until an operator
 * confirms the money arrived.
 *
 * `details` is keyed by the tenant config field name (e.g. `zelle_email`,
 * `ach_routing_number`). Sensitive values are masked by the API — an account
 * number arrives as `****1234`, so `details` is safe to render publicly but is
 * NOT sufficient to actually pay. The unmasked values go out in the emailed
 * instructions only.
 */
export interface ManualPaymentMethod {
    key: "venmo" | "cashapp" | "zelle" | "wire" | "ach" | "check";
    label: string;
    customer_instructions: string | null;
    details: Record<string, string>;
}
export interface ManualPaymentMethodsResponse {
    payment_methods: ManualPaymentMethod[];
}
export interface StoreConfig {
    features: {
        intake: boolean;
        affiliates: boolean;
        reviews: boolean;
        discount_codes: boolean;
        payment_gateway: boolean;
    };
}
export interface StoredPaymentMethod {
    id: string;
    payment_type: "card" | "ach";
    label: string;
    is_default: boolean;
    expires_at: string | null;
}
export interface ShippingOption {
    method_id: string;
    method_name: string;
    price: number;
    is_free: boolean;
}
export interface ShippingEstimateResponse {
    options: ShippingOption[];
}
