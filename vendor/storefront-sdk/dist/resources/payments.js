export class PaymentsResource {
    http;
    constructor(http) {
        this.http = http;
    }
    getClientConfig() {
        return this.http.request("GET", "/payment-gateway/client-config");
    }
    getStoredMethods() {
        return this.http.request("GET", "/stored-payment-methods");
    }
    deleteStoredMethod(methodId) {
        return this.http.request("DELETE", `/stored-payment-methods/${encodeURIComponent(methodId)}`);
    }
}
