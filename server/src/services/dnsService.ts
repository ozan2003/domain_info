/**
 * @file dnsService.ts
 * @fileoverview DNS lookup services. Provides functions to resolve various DNS records for a given domain.
 *
 * @author Ozan Malcı
 */
import { promises as dns } from "node:dns";
import type { LookupResponse, MXRecord } from "../schemas/lookup.schema.js";

/**
 * Helper function for resolving individual DNS records.
 *
 * @param resolver A function returns a promise that resolves to said DNS record.
 * @returns A promise resolves to the DNS record if it exists, or null if it doesn't.
 */
async function resolveOptional<T>(
    resolver: () => Promise<T>,
): Promise<T | null> {
    try {
        return await resolver();
    } catch (error) {
        const code =
            error instanceof Error
                ? (error as { code?: string }).code
                : undefined;
        switch (code) {
            case "ENODATA":
            case "ENOTFOUND": {
                return null;
            }
            default: {
                break;
            }
        }

        throw error;
    }
}

/**
 * Looks up various DNS records for a given domain.
 *
 * Records included are:
 *
 * - A (IPv4 addresses)
 * - MX (Mail Exchange records)
 * - NS (Name Server records)
 * - TXT (Text records)
 * - CNAME (Canonical Name records)
 *
 * @param domain The domain name to look up.
 * @returns A promise that resolves to a `LookupResponse` object containing the DNS records.
 */
export async function lookupDomain(domain: string): Promise<LookupResponse> {
    const [aRecords, mxRecords, nsRecords, txtRecords, cnameRecords] =
        await Promise.all([
            resolveOptional(() => dns.resolve4(domain)),
            resolveOptional(() => dns.resolveMx(domain)),
            resolveOptional(() => dns.resolveNs(domain)),
            resolveOptional(() => dns.resolveTxt(domain)),
            resolveOptional(() => dns.resolveCname(domain)),
        ]);

    return {
        domain,
        a: aRecords ?? [],
        mx: (mxRecords ?? []).map(
            (record) =>
                ({
                    exchange: record.exchange,
                    priority: record.priority,
                }) satisfies MXRecord,
        ),
        ns: nsRecords ?? [],
        txt: (txtRecords ?? []).map((record) => record.join("")),
        cname: cnameRecords ?? [],
    };
}
