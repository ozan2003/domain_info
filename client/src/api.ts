/**
 * @file api.ts
 * @fileoverview API client for the DNS lookup server.
 *
 * @author Ozan Malcı
 */
import type { LookupResponse } from "./types";

/**
 * Fetches DNS records for a given domain from the lookup API.
 *
 * @param domain The domain name to look up.
 * @returns A promise that resolves to the DNS lookup response.
 * @throws An error if the request fails or the server returns a non-OK status.
 */
export async function lookupDomain(domain: string): Promise<LookupResponse> {
    const params = new URLSearchParams({ domain });
    const response = await fetch(`/api/lookup?${params.toString()}`);

    if (!response.ok) {
        const body = await response.json().catch(() => null);
        const message =
            (body as { error?: string } | null)?.error ??
            `Lookup failed (${response.status})`;
        throw new Error(message);
    }

    return response.json() as Promise<LookupResponse>;
}
