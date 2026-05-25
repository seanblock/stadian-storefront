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
}
export interface StorefrontProductGroup {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    image_url: string | null;
    product_count: number;
    products: StorefrontGroupProduct[];
}
export interface StorefrontProduct {
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
export interface StorefrontCartItem {
    id: string;
    product_id: string;
    product_name: string;
    product_slug: string;
    quantity: number;
    unit_price: number;
    line_total: number;
}
export interface StorefrontCart {
    id: string;
    items: StorefrontCartItem[];
    subtotal: number;
    discount_amount: number;
    tax_amount: number;
    total: number;
    promotion_code: string | null;
}
export interface StorefrontOrder {
    id: string;
    order_number: string | null;
    status: string;
    subtotal: number;
    discount_amount: number;
    tax_amount: number;
    total: number;
    tracking_number: string | null;
    tracking_url: string | null;
    created_at: string;
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
    affiliate_code: string | null;
    affiliate_link_slug: string | null;
    commission_rate: number | null;
    affiliate_status: string | null;
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
}
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
