import type { HttpClient } from "../client";
import type { PaymentClientConfig, StoredPaymentMethod } from "../types";
export declare class PaymentsResource {
    private http;
    constructor(http: HttpClient);
    getClientConfig(): Promise<PaymentClientConfig>;
    getStoredMethods(): Promise<StoredPaymentMethod[]>;
    deleteStoredMethod(methodId: string): Promise<void>;
}
