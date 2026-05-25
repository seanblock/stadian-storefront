/**
 * Base error class for all Stadian SDK errors.
 */
export declare class StadianError extends Error {
    readonly status: number;
    readonly code: string;
    constructor(message: string, status: number, code: string);
}
/**
 * Thrown when the API returns a 401 Unauthorized response.
 */
export declare class StadianAuthError extends StadianError {
    constructor(message?: string);
}
/**
 * Thrown when the API returns a 404 Not Found response.
 */
export declare class StadianNotFoundError extends StadianError {
    constructor(message?: string);
}
/**
 * Thrown when the API returns a 429 Too Many Requests response.
 * `retryAfter` is the number of seconds to wait before retrying.
 */
export declare class StadianRateLimitError extends StadianError {
    readonly retryAfter: number;
    constructor(message?: string, retryAfter?: number);
}
