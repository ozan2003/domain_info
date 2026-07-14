/**
 * @file constants.ts
 * @fileoverview Shared error messages and config values used across the client.
 *
 * @author Ozan Malcı
 */

export const MIN_PASSWORD_LENGTH = 8;
export const SHORT_PASSWD_ERROR_MSG = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;

export const NETWORK_ERROR_MESSAGE = "Network error. Please try again.";

export const ROOT_ELEMENT_NOT_FOUND_ERROR_MSG = "Root element not found.";

export const AUTH_CONTEXT_ERROR_MSG =
    "useAuth must be used within an AuthProvider.";
