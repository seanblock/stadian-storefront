import { StadianAuthError, StadianError, StadianNotFoundError, StadianRateLimitError, } from "./errors";
// ---------------------------------------------------------------------------
// HttpClient — low-level transport with retry logic
// ---------------------------------------------------------------------------
export class HttpClient {
    apiKey;
    baseUrl;
    maxRetries;
    timeoutMs;
    constructor(config) {
        // Strip trailing slash so we can safely append paths
        this.apiKey = config.apiKey;
        this.baseUrl = config.baseUrl.replace(/\/+$/, "");
        this.maxRetries = config.maxRetries ?? 3;
        // Abort a single attempt after this many ms so a slow or unreachable API
        // never wedges server-side rendering. Each attempt gets its own timer.
        this.timeoutMs = config.timeoutMs ?? 10000;
    }
    /**
     * Make an authenticated request to the storefront API.
     *
     * Automatically retries on 429 (honouring the Retry-After header) and on
     * 5xx responses using exponential back-off.
     */
    async request(method, path, options = {}) {
        const url = this.buildUrl(path, options.query);
        const headers = {
            "X-API-Key": this.apiKey,
            "Content-Type": "application/json",
            Accept: "application/json",
            ...options.headers,
        };
        const init = {
            method,
            headers,
        };
        if (options.body !== undefined) {
            init.body = JSON.stringify(options.body);
        }
        let lastError;
        for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
            // Per-attempt timeout: a fresh AbortController each time (a controller
            // cannot be reused once aborted). Timeouts and network failures are
            // retried with the same back-off as 5xx, then surfaced as an error
            // rather than hanging the caller indefinitely.
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), this.timeoutMs);
            let response;
            try {
                response = await fetch(url, { ...init, signal: controller.signal });
            }
            catch (err) {
                const isTimeout = err?.name === "AbortError";
                lastError = new StadianError(isTimeout
                    ? `Request to ${path} timed out after ${this.timeoutMs}ms`
                    : `Request to ${path} failed: ${err?.message ?? "network error"}`, 0, isTimeout ? "TIMEOUT" : "NETWORK");
                if (attempt < this.maxRetries) {
                    await this.sleep(500 * Math.pow(2, attempt));
                    continue;
                }
                throw lastError;
            }
            finally {
                clearTimeout(timer);
            }
            if (response.ok) {
                // 204 No Content — return body-less result
                if (response.status === 204) {
                    return undefined;
                }
                return (await response.json());
            }
            // Parse the error body once (best-effort)
            let errorMessage = response.statusText;
            let errorCode = "UNKNOWN";
            try {
                const body = await response.json();
                if (typeof body === "object" && body !== null) {
                    // Stadian AppErrors are nested as { error: { code, message } };
                    // FastAPI validation errors use top-level { detail }.
                    const nested = body.error;
                    errorMessage =
                        nested?.message ??
                            body.detail ??
                            body.message ??
                            errorMessage;
                    errorCode =
                        nested?.code ??
                            body.code ??
                            errorCode;
                }
            }
            catch {
                // body may not be JSON — keep the statusText
            }
            // Classify error
            if (response.status === 401) {
                throw new StadianAuthError(errorMessage);
            }
            if (response.status === 404) {
                throw new StadianNotFoundError(errorMessage);
            }
            if (response.status === 429) {
                const retryAfter = parseInt(response.headers.get("Retry-After") ?? "5", 10);
                lastError = new StadianRateLimitError(errorMessage, retryAfter);
                if (attempt < this.maxRetries) {
                    await this.sleep(retryAfter * 1000);
                    continue;
                }
                throw lastError;
            }
            if (response.status >= 500) {
                lastError = new StadianError(errorMessage, response.status, errorCode);
                if (attempt < this.maxRetries) {
                    // Exponential back-off: 500ms, 1s, 2s, ...
                    await this.sleep(500 * Math.pow(2, attempt));
                    continue;
                }
                throw lastError;
            }
            // Non-retryable client error (400, 403, 409, etc.)
            throw new StadianError(errorMessage, response.status, errorCode);
        }
        // Should never reach here, but just in case
        throw lastError ?? new StadianError("Request failed", 0, "UNKNOWN");
    }
    // ---------------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------------
    buildUrl(path, query) {
        const base = `${this.baseUrl}/v1/storefront${path}`;
        if (!query)
            return base;
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(query)) {
            if (value !== undefined) {
                params.set(key, String(value));
            }
        }
        const qs = params.toString();
        return qs ? `${base}?${qs}` : base;
    }
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
