import type { PaymentClientConfig } from "./types";
export interface PaymentFormContainerIds {
    cardNumber?: string;
    cardExpiry?: string;
    cardCvv?: string;
    accountNumber?: string;
    routingNumber?: string;
}
export interface TokenizeResult {
    token: string;
    payment_type: "card" | "ach";
}
export declare class PaymentForm {
    private config;
    private containerIds;
    private _destroyed;
    private constructor();
    static mount(config: PaymentClientConfig, containerIds: PaymentFormContainerIds): Promise<PaymentForm>;
    private _init;
    private _initCollectJs;
    tokenize(): Promise<TokenizeResult>;
    private _tokenizeNmi;
    private _tokenizeAuthNet;
    destroy(): void;
}
