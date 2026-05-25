/**
 * Base error class for all Stadian SDK errors.
 */
export class StadianError extends Error {
    status;
    code;
    constructor(message, status, code) {
        super(message);
        this.name = "StadianError";
        this.status = status;
        this.code = code;
        // Restore prototype chain (required when extending built-ins in TS)
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
/**
 * Thrown when the API returns a 401 Unauthorized response.
 */
export class StadianAuthError extends StadianError {
    constructor(message = "Unauthorized") {
        super(message, 401, "UNAUTHORIZED");
        this.name = "StadianAuthError";
    }
}
/**
 * Thrown when the API returns a 404 Not Found response.
 */
export class StadianNotFoundError extends StadianError {
    constructor(message = "Not found") {
        super(message, 404, "NOT_FOUND");
        this.name = "StadianNotFoundError";
    }
}
/**
 * Thrown when the API returns a 429 Too Many Requests response.
 * `retryAfter` is the number of seconds to wait before retrying.
 */
export class StadianRateLimitError extends StadianError {
    retryAfter;
    constructor(message = "Rate limit exceeded", retryAfter = 60) {
        super(message, 429, "RATE_LIMITED");
        this.name = "StadianRateLimitError";
        this.retryAfter = retryAfter;
    }
}
