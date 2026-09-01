export interface HttpClientConfig {
    apiKey: string;
    baseUrl: string;
    /** Maximum number of automatic retries on 429 / 5xx. Defaults to 3. */
    maxRetries?: number;
    /**
     * Abort a single attempt after this many ms so a slow or unreachable API never
     * wedges server-side rendering. Each attempt gets its own timer. Defaults to 10000.
     */
    timeoutMs?: number;
    /**
     * The END USER's IP address, when this client is acting on behalf of one.
     *
     * A storefront calls the API server-side with a secret key, so from the API's
     * side every visitor of a store shares one source address. Forwarding the real
     * one is what lets rate limiting and the checkout velocity guard tell visitors
     * apart — without it, one bot's traffic is counted against every customer.
     *
     * Per-client, never per-process: build a client for the request you are
     * serving. A shared singleton carrying one visitor's IP would attribute
     * everyone else's traffic to them.
     */
    clientIp?: string;
}
export interface RequestOptions {
    body?: unknown;
    query?: Record<string, string | number | boolean | undefined>;
    headers?: Record<string, string>;
}
export declare class HttpClient {
    private readonly apiKey;
    private readonly baseUrl;
    private readonly maxRetries;
    private readonly timeoutMs;
    private readonly clientIp?;
    constructor(config: HttpClientConfig);
    /**
     * Make an authenticated request to the storefront API.
     *
     * Automatically retries on 429 (honouring the Retry-After header) and on
     * 5xx responses using exponential back-off.
     */
    request<T>(method: string, path: string, options?: RequestOptions): Promise<T>;
    private buildUrl;
    private sleep;
}
