export class PaymentsResource {
    http;
    constructor(http) {
        this.http = http;
    }
    getClientConfig() {
        return this.http.request("GET", "/payment-gateway/client-config");
    }
    /**
     * The manual (offline) payment methods this tenant accepts — Zelle, ACH,
     * wire, check, etc. Independent of the card gateway: a store can offer both,
     * either, or neither.
     */
    async getManualMethods() {
        const res = await this.http.request("GET", "/payment-methods");
        return res.payment_methods ?? [];
    }
    getStoredMethods() {
        return this.http.request("GET", "/stored-payment-methods");
    }
    deleteStoredMethod(methodId) {
        return this.http.request("DELETE", `/stored-payment-methods/${encodeURIComponent(methodId)}`);
    }
}
