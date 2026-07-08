/**
 * @file dnsService.ts
 * @fileoverview Raw DNS resolution services. Provides functions to resolve various DNS records for a given domain.
 *
 * @author Ozan Malcı
 */
import { promises as dns } from "node:dns";
import type { DnsLookupResult, MXRecord } from "../schemas/lookup.schema.js";
import { type Option, Some, None } from "oxide.ts";

/**
 * Helper function for resolving individual DNS records.
 *
 * @param resolver A function returns a promise that resolves to said DNS record.
 * @returns `Some(records)` if resolution succeeds, or `None` if the record type doesn't exist.
 */
async function resolveOptional<T>(
    resolver: () => Promise<T>,
): Promise<Option<T>> {
    try {
        return Some(await resolver());
    } catch (error) {
        const code =
            error instanceof Error
                ? (error as { code?: string }).code
                : undefined;
        if (code === "ENODATA" || code === "ENOTFOUND") {
            return None;
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
 * @returns A promise that resolves to the raw DNS record payload.
 */
export async function lookupDomain(domain: string): Promise<DnsLookupResult> {
    const [
        aRecords,
        aaaaRecords,
        mxRecords,
        nsRecords,
        txtRecords,
        cnameRecords,
    ] = await Promise.all([
        resolveOptional(() => dns.resolve4(domain)),
        resolveOptional(() => dns.resolve6(domain)),
        resolveOptional(() => dns.resolveMx(domain)),
        resolveOptional(() => dns.resolveNs(domain)),
        resolveOptional(() => dns.resolveTxt(domain)),
        resolveOptional(() => dns.resolveCname(domain)),
    ]);

    return {
        domain,
        a: aRecords.unwrapOr([]),
        aaaa: aaaaRecords.unwrapOr([]),
        mx: mxRecords.unwrapOr([]).map(
            (record) =>
                ({
                    exchange: record.exchange,
                    priority: record.priority,
                }) satisfies MXRecord,
        ),
        ns: nsRecords.unwrapOr([]),
        txt: txtRecords.mapOr([], (records) =>
            records.map((record) => record.join("")),
        ),
        cname: cnameRecords.unwrapOr([]),
    };
}
