// ---------------------------------------------------------------------------
// Resource
// ---------------------------------------------------------------------------
/**
 * Sales-rep (POS) surface. Every method requires the REP's own customerToken —
 * a storefront JWT whose role carries the rep.* permissions.
 */
export class RepResource {
    http;
    constructor(http) {
        this.http = http;
    }
    auth(token) {
        return { Authorization: `Bearer ${token}` };
    }
    /**
     * The catalog priced for the customer the rep is selling to.
     *
     * Without `customerId` prices come from the rep's own tier and are only
     * indicative — pass the attached customer so the grid matches what the cart
     * will actually charge.
     */
    listProducts(params) {
        return this.http.request("GET", "/rep/products", {
            headers: this.auth(params.customerToken),
            query: {
                customer_id: params.customerId,
                page: params.page,
                limit: params.limit,
                search: params.search,
                category_id: params.categoryId,
            },
        });
    }
    /** Search the store's customers (staff never appear). */
    searchCustomers(params) {
        return this.http.request("GET", "/rep/customers", {
            headers: this.auth(params.customerToken),
            query: { search: params.search, limit: params.limit, offset: params.offset },
        });
    }
    /** Single customer, including their most recent ship-to for prefill. */
    getCustomer(params) {
        return this.http.request("GET", `/rep/customers/${encodeURIComponent(params.customerId)}`, { headers: this.auth(params.customerToken) });
    }
    /** Create a customer account on the spot (claimed via emailed set-password invite). */
    createCustomer(params) {
        return this.http.request("POST", "/rep/customers", {
            headers: this.auth(params.customerToken),
            body: {
                email: params.email,
                first_name: params.firstName,
                last_name: params.lastName ?? "",
                phone: params.phone,
                customer_type: params.customerType,
                company_name: params.companyName,
                send_invite: params.sendInvite ?? true,
            },
        });
    }
    /** Bind a POS cart session to the customer so the cart prices at THEIR tier. */
    bindCart(params) {
        return this.http.request("POST", "/rep/cart/bind", {
            headers: this.auth(params.customerToken),
            body: { session_token: params.sessionToken, customer_id: params.customerId },
        });
    }
    /** Place an order on behalf of a customer (card / pay-by-link / invoice). */
    checkout(params) {
        return this.http.request("POST", "/rep/checkout", {
            headers: this.auth(params.customerToken),
            body: {
                session_token: params.sessionToken,
                customer_id: params.customerId,
                shipping_address: params.shippingAddress,
                billing_address: params.billingAddress,
                shipping_method_id: params.shippingMethodId,
                notes: params.notes,
                payment_method: params.paymentMethod,
                payment_token: params.paymentToken,
                payment_type: params.paymentType,
                payment_flow: params.paymentFlow,
                send_payment_link_email: params.sendPaymentLinkEmail ?? false,
                accept_disclaimers: params.acceptDisclaimers ?? false,
            },
        });
    }
    /** Orders this rep placed. */
    listOrders(params) {
        return this.http.request("GET", "/rep/orders", {
            headers: this.auth(params.customerToken),
            query: { status: params.status, limit: params.limit, offset: params.offset },
        });
    }
    /** Single rep-placed order with line items and payment-link state. */
    getOrder(params) {
        return this.http.request("GET", `/rep/orders/${encodeURIComponent(params.orderId)}`, { headers: this.auth(params.customerToken) });
    }
    /** (Re)send the payment-link email for a pending rep-placed order. */
    sendPaymentLink(params) {
        return this.http.request("POST", `/rep/orders/${encodeURIComponent(params.orderId)}/send-payment-link`, { headers: this.auth(params.customerToken) });
    }
    /** Sales + commission aggregates for the signed-in rep. */
    dashboard(params) {
        return this.http.request("GET", "/rep/dashboard", {
            headers: this.auth(params.customerToken),
        });
    }
}
