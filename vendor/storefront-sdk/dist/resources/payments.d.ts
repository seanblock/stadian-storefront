import type { HttpClient } from "../client";
import type { ManualPaymentMethod, PaymentClientConfig, StoredPaymentMethod } from "../types";
export declare class PaymentsResource {
    private http;
    constructor(http: HttpClient);
    getClientConfig(): Promise<PaymentClientConfig>;
    /**
     * The manual (offline) payment methods this tenant accepts — Zelle, ACH,
     * wire, check, etc. Independent of the card gateway: a store can offer both,
     * either, or neither.
     */
    getManualMethods(): Promise<ManualPaymentMethod[]>;
    getStoredMethods(): Promise<StoredPaymentMethod[]>;
    deleteStoredMethod(methodId: string): Promise<void>;
}
