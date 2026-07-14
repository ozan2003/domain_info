/**
 * @file constants.ts
 * @fileoverview Shared error messages and config values used across the server.
 *
 * @author Ozan Malcı
 */

// ---------------------------------------------------------------------------
//  Config values
// ---------------------------------------------------------------------------

export const MIN_PASSWORD_LENGTH = 8;
export const MIN_JWT_SECRET_LENGTH = 32;

// ---------------------------------------------------------------------------
//  Error messages — auth / JWT
// ---------------------------------------------------------------------------

/** Thrown on start-up when the JWT_SECRET env var is empty. */
export const JWT_SECRET_MISSING_ERROR_MSG =
    "JWT_SECRET environment variable is not set";

/** Thrown on start-up when the JWT_SECRET is too short. */
export const JWT_SECRET_TOO_SHORT_ERROR_MSG = (got: number): string =>
    `JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters (got ${got})`;

/** Thrown on start-up when the JWT_SECRET is still the default placeholder. */
export const JWT_SECRET_PLACEHOLDER_ERROR_MSG =
    "JWT_SECRET is still the placeholder value. Set a real secret in .env";

/** Returned to the client when a JWT is missing, expired, or malformed. */
export const INVALID_TOKEN_ERROR_MSG = "Invalid or expired token.";

/** Returned to the client when the JWT payload fields are missing. */
export const INVALID_TOKEN_PAYLOAD_ERROR_MSG = "Invalid token payload.";

/** Returned to the client when registering with an existing email. */
export const EMAIL_TAKEN_ERROR_MSG = "Email already registered.";

/** Returned to the client when login credentials are wrong. */
export const INVALID_CREDENTIALS_ERROR_MSG = "Invalid email or password.";

/** Password validation message used in the registration/login Zod schema. */
export const SHORT_PASSWD_ERROR_MSG = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;

/** Returned to the client when a protected route is hit without a token. */
export const AUTH_REQUIRED_ERROR_MSG = "Authentication required.";

// ---------------------------------------------------------------------------
//  Error messages — Zod schemas (IP / domain)
// ---------------------------------------------------------------------------

export const INVALID_IP_ERROR_MSG = "Invalid IP address.";
export const REQUIRED_IP_ERROR_MSG = "An IP address is required.";
export const DOMAIN_REQUIRED_ERROR_MSG = "A domain is required.";
export const DOMAIN_TOO_LONG_ERROR_MSG = "The domain is too long.";

// ---------------------------------------------------------------------------
//  Error messages — history
// ---------------------------------------------------------------------------

export const HISTORY_NOT_FOUND_ERROR_MSG = "History item not found.";

export const INVALID_KIND_ERROR_MSG = (kind: string): string =>
    `Invalid kind: ${kind}.`;

export const MISSING_KIND_ID_ERROR_MSG = "Missing kind or id parameter.";

export const INVALID_ID_ERROR_MSG = (rawId: string): string =>
    `Invalid id: ${rawId}.`;

// ---------------------------------------------------------------------------
//  Error messages — WHOIS
// ---------------------------------------------------------------------------

export const WHOIS_LOOKUP_FAILED_ERROR_MSG = "Whois lookup failed.";
export const WHOIS_NO_DATA_ERROR_MSG = "Whois lookup returned no data.";

// ---------------------------------------------------------------------------
//  Error messages — traceroute
// ---------------------------------------------------------------------------

export const TRACEROUTE_NOT_FOUND_ERROR_MSG =
    "Traceroute command not found. Please ensure traceroute (Linux/macOS) or tracert (Windows) is installed.";

export const TRACEROUTE_START_FAILED_ERROR_MSG = (reason: string): string =>
    `Failed to start traceroute: ${reason}.`;

// ---------------------------------------------------------------------------
//  Error messages — validation helpers
// ---------------------------------------------------------------------------

export const INVALID_QUERY_ERROR_MSG = "Invalid query.";
export const INVALID_JSON_BODY_ERROR_MSG = "Invalid JSON body.";
export const INVALID_INPUT_ERROR_MSG = "Invalid input.";

// ---------------------------------------------------------------------------
//  Error messages — app-level
// ---------------------------------------------------------------------------

export const INTERNAL_SERVER_ERROR_MSG = "Internal Server Error.";
export const NOT_FOUND_ERROR_MSG = "Not Found.";
