/**
 * @file api.ts
 * @fileoverview API client for the DNS lookup server.
 *
 * @author Ozan Malcı
 */
import type { AuthUser, LookupResponse } from "./types";
import { type Result, Ok, Err, type Option, Some, None } from "oxide.ts";

/**
 * Reads a human-readable error message from a failed response.
 *
 * @param response The fetch Response that was not ok.
 * @returns The error string from the body, or a status-based fallback.
 */
async function readErrorMessage(response: Response): Promise<string> {
    const body = (await response.json().catch(() => null)) as {
        error?: string;
        message?: string;
    } | null;
    return (
        body?.error ??
        body?.message ??
        `Request failed (${String(response.status)})`
    );
}

/**
 * Fetches DNS records for a given domain from the lookup API.
 *
 * @param domain The domain name to look up.
 * @returns `Ok(data)` on success, or `Err(message)` if the request fails.
 */
export async function lookupDomain(
    domain: string,
): Promise<Result<LookupResponse, string>> {
    const params = new URLSearchParams({ domain });
    const response = await fetch(`/api/lookup?${params.toString()}`);

    if (!response.ok) {
        return Err(await readErrorMessage(response));
    }

    const data = (await response.json()) as LookupResponse;
    return Ok(data);
}

/**
 * Fetches the currently authenticated user.
 *
 * @returns `Ok(Some(user))` if a valid session cookie is present, `Ok(None)`
 *   if not (401), or `Err(message)` on transport failure.
 */
export async function fetchMe(): Promise<Result<Option<AuthUser>, string>> {
    const response = await fetch("/api/auth/me");

    if (response.status === 401) {
        return Ok(None);
    }
    if (!response.ok) {
        return Err(await readErrorMessage(response));
    }

    const data = (await response.json()) as AuthUser;
    return Ok(Some(data));
}

interface AuthPayload {
    email: string;
    password: string;
}

/**
 * Posts a JSON body to an auth endpoint and returns the resulting user.
 *
 * @param path The auth endpoint path.
 * @param payload The email/password to send.
 * @returns `Ok(user)` on success, or `Err(message)` on failure.
 */
async function postAuth(
    path: string,
    payload: AuthPayload,
): Promise<Result<AuthUser, string>> {
    const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        return Err(await readErrorMessage(response));
    }

    const data = (await response.json()) as AuthUser;
    return Ok(data);
}

/**
 * Logs a user in by email and password. Sets the session cookie on success.
 *
 * @param email The user's email.
 * @param password The user's password.
 * @returns `Ok(user)` on success, or `Err(message)` on failure.
 */
export async function login(
    email: string,
    password: string,
): Promise<Result<AuthUser, string>> {
    return postAuth("/api/auth/login", { email, password });
}

/**
 * Registers a new user and logs them in.
 *
 * @param email The user's email.
 * @param password The user's password (min 8 chars per server schema).
 * @returns `Ok(user)` on success, or `Err(message)` on failure.
 */
export async function register(
    email: string,
    password: string,
): Promise<Result<AuthUser, string>> {
    return postAuth("/api/auth/register", { email, password });
}

/**
 * Logs the current user out by clearing the session cookie.
 *
 * @returns `Ok(null)` on success, or `Err(message)` on transport failure.
 */
// null is used as unit value
export async function logout(): Promise<Result<null, string>> {
    const response = await fetch("/api/auth/logout", { method: "POST" });
    if (!response.ok) {
        return Err(await readErrorMessage(response));
    }
    return Ok(null);
}
