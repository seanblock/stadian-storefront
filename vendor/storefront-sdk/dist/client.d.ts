export interface HttpClientConfig {
    apiKey: string;
    baseUrl: string;
    /** Maximum number of automatic retries on 429 / 5xx. Defaults to 3. */
    maxRetries?: number;
    /** Per-attempt request timeout in milliseconds. Defaults to 10000. */
    timeoutMs?: number;
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
