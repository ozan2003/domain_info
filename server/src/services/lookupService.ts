/**
 * @file lookupService.ts
 * @fileoverview Orchestrates DNS lookups with 1-hour cache/dedup. Persists every request to the database.
 *
 * @author Ozan Malcı
 */
import { prisma } from "../db.js";
import { lookupDomain } from "./dnsService.js";
import type { Prisma } from "../generated/prisma/client.js";
import type { LookupResponse } from "../schemas/lookup.schema.js";

/** Cache TTL in milliseconds (1 hour). */
const CACHE_TTL_MS = 60 * 60 * 1000;

type LookupWithRecords = Prisma.LookupGetPayload<{
    include: {
        aRecords: true;
        mxRecords: true;
        nsRecords: true;
        txtRecords: true;
        cnameRecords: true;
    };
}>;

/**
 * Maps a Lookup row (with included child records) to the API response shape.
 */
function toLookupResponse(lookup: LookupWithRecords): LookupResponse {
    return {
        domain: lookup.domain,
        isCached: lookup.isCached,
        createdAt: lookup.createdAt.toISOString(),
        a: lookup.aRecords.map((a) => a.address),
        mx: lookup.mxRecords.map((mx) => ({
            exchange: mx.exchange,
            priority: mx.priority,
        })),
        ns: lookup.nsRecords.map((ns) => ns.nameserver),
        txt: lookup.txtRecords.map((txt) => txt.value),
        cname: lookup.cnameRecords.map((cname) => cname.value),
    };
}

/**
 * Performs a domain lookup. Checks the cache first (1-hour window), and if a
 * recent result exists, creates a new Lookup row marked as cached. Otherwise,
 * resolves DNS fresh and persists the results.
 *
 * Every call writes to the DB so the history timeline is complete.
 *
 * @param domain The domain name to look up.
 * @returns The lookup response including DNS records, cache status, and timestamp.
 */
export async function performLookup(domain: string): Promise<LookupResponse> {
    const cacheThreshold = new Date(Date.now() - CACHE_TTL_MS);

    // Check for a recent lookup of the same domain.
    const cached = await prisma.lookup.findFirst({
        where: {
            domain,
            createdAt: { gte: cacheThreshold },
        },
        include: {
            aRecords: true,
            mxRecords: true,
            nsRecords: true,
            txtRecords: true,
            cnameRecords: true,
        },
        orderBy: { createdAt: "desc" },
    });

    if (cached) {
        // Cache hit: create a new row marked as cached, copying the records.
        const lookup = await prisma.lookup.create({
            data: {
                domain,
                isCached: true,
                aRecords: {
                    create: cached.aRecords.map((a) => ({
                        address: a.address,
                    })),
                },
                mxRecords: {
                    create: cached.mxRecords.map((mx) => ({
                        exchange: mx.exchange,
                        priority: mx.priority,
                    })),
                },
                nsRecords: {
                    create: cached.nsRecords.map((ns) => ({
                        nameserver: ns.nameserver,
                    })),
                },
                txtRecords: {
                    create: cached.txtRecords.map((txt) => ({
                        value: txt.value,
                    })),
                },
                cnameRecords: {
                    create: cached.cnameRecords.map((cname) => ({
                        value: cname.value,
                    })),
                },
            },
            include: {
                aRecords: true,
                mxRecords: true,
                nsRecords: true,
                txtRecords: true,
                cnameRecords: true,
            },
        });

        return toLookupResponse(lookup);
    }

    // Cache miss: resolve DNS fresh.
    const dnsResult = await lookupDomain(domain);

    const lookup = await prisma.lookup.create({
        data: {
            domain,
            isCached: false,
            aRecords: {
                create: dnsResult.a.map((a) => ({ address: a })),
            },
            mxRecords: {
                create: dnsResult.mx.map((mx) => ({
                    exchange: mx.exchange,
                    priority: mx.priority,
                })),
            },
            nsRecords: {
                create: dnsResult.ns.map((ns) => ({ nameserver: ns })),
            },
            txtRecords: {
                create: dnsResult.txt.map((txt) => ({
                    value: txt,
                })),
            },
            cnameRecords: {
                create: dnsResult.cname.map((cname) => ({
                    value: cname,
                })),
            },
        },
        include: {
            aRecords: true,
            mxRecords: true,
            nsRecords: true,
            txtRecords: true,
            cnameRecords: true,
        },
    });

    return toLookupResponse(lookup);
}
