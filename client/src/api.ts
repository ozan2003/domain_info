/**
 * @file api.ts
 * @fileoverview API client for the DNS lookup server.
 *
 * @author Ozan Malcı
 */
import type { LookupResponse } from "./types";
import { type Result, Ok, Err } from "oxide.ts";

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
        const body = (await response.json().catch(() => null)) as {
            error?: string;
        } | null;
        const message =
            body?.error ?? `Lookup failed (${String(response.status)})`;
        return Err(message);
    }

    const data = (await response.json()) as LookupResponse;
    return Ok(data);
}
