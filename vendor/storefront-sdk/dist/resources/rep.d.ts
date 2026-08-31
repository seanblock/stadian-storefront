import type { HttpClient } from "../client";
import type { PaginatedList, RepCheckoutResponse, RepCustomer, RepCustomersResponse, RepDashboard, RepOrderSummary, RepOrdersResponse, StorefrontProduct } from "../types";
export interface RepListProductsParams {
    customerToken: string;
    /** Price the grid at this customer's tier. Omit for the rep's own tier. */
    customerId?: string;
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
}
export interface RepSearchCustomersParams {
    customerToken: string;
    search?: string;
    limit?: number;
    offset?: number;
}
export interface RepCreateCustomerParams {
    customerToken: string;
    email: string;
    firstName: string;
    lastName?: string;
    phone?: string;
    customerType?: "individual" | "business";
    companyName?: string;
    /** Email the customer a set-password link so they can claim the account. Default true. */
    sendInvite?: boolean;
}
export interface RepBindCartParams {
    customerToken: string;
    sessionToken: string;
    customerId: string;
}
export interface RepCheckoutParams {
    customerToken: string;
    sessionToken: string;
    /** The customer this order is placed FOR. */
    customerId: string;
    shippingAddress?: Record<string, unknown>;
    billingAddress?: Record<string, unknown>;
    shippingMethodId?: string;
    notes?: string;
    /** "invoice" places the order unpaid (settled later by the store). */
    paymentMethod?: string;
    paymentToken?: string;
    paymentType?: "card" | "ach";
    paymentFlow?: "embedded" | "redirect";
    /** Email the pay-by-link to the customer (link-capable gateways only). */
    sendPaymentLinkEmail?: boolean;
    /** Rep attests the customer confirmed required disclaimers in person. */
    acceptDisclaimers?: boolean;
}
export interface RepListOrdersParams {
    customerToken: string;
    status?: string;
    limit?: number;
    offset?: number;
}
/**
 * Sales-rep (POS) surface. Every method requires the REP's own customerToken —
 * a storefront JWT whose role carries the rep.* permissions.
 */
export declare class RepResource {
    private http;
    constructor(http: HttpClient);
    private auth;
    /**
     * The catalog priced for the customer the rep is selling to.
     *
     * Without `customerId` prices come from the rep's own tier and are only
     * indicative — pass the attached customer so the grid matches what the cart
     * will actually charge.
     */
    listProducts(params: RepListProductsParams): Promise<PaginatedList<StorefrontProduct>>;
    /** Search the store's customers (staff never appear). */
    searchCustomers(params: RepSearchCustomersParams): Promise<RepCustomersResponse>;
    /** Single customer, including their most recent ship-to for prefill. */
    getCustomer(params: {
        customerToken: string;
        customerId: string;
    }): Promise<RepCustomer>;
    /** Create a customer account on the spot (claimed via emailed set-password invite). */
    createCustomer(params: RepCreateCustomerParams): Promise<RepCustomer>;
    /** Bind a POS cart session to the customer so the cart prices at THEIR tier. */
    bindCart(params: RepBindCartParams): Promise<{
        ok: boolean;
        customer_id: string;
    }>;
    /** Place an order on behalf of a customer (card / pay-by-link / invoice). */
    checkout(params: RepCheckoutParams): Promise<RepCheckoutResponse>;
    /** Orders this rep placed. */
    listOrders(params: RepListOrdersParams): Promise<RepOrdersResponse>;
    /** Single rep-placed order with line items and payment-link state. */
    getOrder(params: {
        customerToken: string;
        orderId: string;
    }): Promise<RepOrderSummary>;
    /** (Re)send the payment-link email for a pending rep-placed order. */
    sendPaymentLink(params: {
        customerToken: string;
        orderId: string;
    }): Promise<{
        ok: boolean;
    }>;
    /** Sales + commission aggregates for the signed-in rep. */
    dashboard(params: {
        customerToken: string;
    }): Promise<RepDashboard>;
}
