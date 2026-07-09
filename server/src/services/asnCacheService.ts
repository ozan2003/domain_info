/**
 * @file asnCacheService.ts
 * @fileoverview Orchestrates ASN lookups with a 1-hour database cache.
 * Mirrors the pattern used by `whoisCacheService.ts` and
 * `tracerouteCacheService.ts`: on a cache hit the previous row is copied
 * into a new row marked `isCached: true`; on a miss `asnService.lookupAsn`
 * is called and the result persisted.
 *
 * @author Ozan Malcı
 */
import { prisma } from "../db.js";
import type { Prisma } from "../generated/prisma/client.js";
import type { AsnResponse } from "../schemas/asn.schema.js";
import { lookupAsn, type AsnLookupResult } from "./asnService.js";

const CACHE_TTL_MS = 60 * 60 * 1000;

type AsnRow = Prisma.ASNLookupGetPayload<{
    select: {
        ip: true;
        asNumber: true;
        asName: true;
        prefix: true;
        isCached: true;
        createdAt: true;
    };
}>;

function toAsnResponse(row: AsnRow): AsnResponse {
    return {
        ip: row.ip,
        asNumber: row.asNumber,
        asName: row.asName,
        prefix: row.prefix,
        isCached: row.isCached,
        createdAt: row.createdAt.toISOString(),
    };
}

const rowSelect = {
    ip: true,
    asNumber: true,
    asName: true,
    prefix: true,
    isCached: true,
    createdAt: true,
} as const satisfies Prisma.ASNLookupSelect;

/**
 * Creates a new `ASNLookup` row copied from an existing cached row, marked
 * `isCached: true`, so the per-user history timeline stays complete.
 */
async function createCachedCopy(
    ip: string,
    cached: AsnRow,
    userId: number,
): Promise<AsnRow> {
    return prisma.aSNLookup.create({
        data: {
            ip,
            asNumber: cached.asNumber,
            asName: cached.asName,
            prefix: cached.prefix,
            isCached: true,
            userId,
        },
        select: rowSelect,
    });
}

/**
 * Persists a fresh ASN result as a new `ASNLookup` row.
 */
async function persistFreshResult(
    ip: string,
    result: AsnLookupResult,
    userId: number,
): Promise<AsnRow> {
    return prisma.aSNLookup.create({
        data: {
            ip,
            asNumber: result.asNumber.mapOr<number | null>(null, (v) => v),
            asName: result.asName.mapOr<string | null>(null, (v) => v),
            prefix: result.prefix.mapOr<string | null>(null, (v) => v),
            isCached: false,
            userId,
        },
        select: rowSelect,
    });
}

/**
 * Performs an ASN lookup with a 1-hour database cache.
 *
 * Every call writes an `ASNLookup` row so the history timeline is complete,
 * even when the result is served from the cache.
 *
 * @param ip The IPv4 or IPv6 address to look up.
 * @param userId The authenticated user's database ID.
 * @returns The normalized ASN response.
 */
export async function performAsnLookup(
    ip: string,
    userId: number,
): Promise<AsnResponse> {
    const cacheThreshold = new Date(Date.now() - CACHE_TTL_MS);

    const cached = await prisma.aSNLookup.findFirst({
        where: {
            ip,
            createdAt: { gte: cacheThreshold },
        },
        orderBy: { createdAt: "desc" },
        select: rowSelect,
    });

    if (cached) {
        const copy = await createCachedCopy(ip, cached, userId);
        return toAsnResponse(copy);
    }

    const result = await lookupAsn(ip);
    const row = await persistFreshResult(ip, result, userId);
    return toAsnResponse(row);
}
