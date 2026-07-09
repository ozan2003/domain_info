/**
 * @file tracerouteCacheService.ts
 * @fileoverview Orchestrates traceroute lookups with a 1-hour database cache.
 * Follows the same pattern as `lookupService.ts`: on a cache hit the previous
 * hops are copied into a new row marked `isCached: true`; on a miss
 * `tracerouteService.runTraceroute` is called and the result persisted.
 *
 * @author Ozan Malcı
 */
import { prisma } from "../db.js";
import { runTraceroute, type TracerouteResult } from "./tracerouteService.js";
import type { TracerouteResponse } from "../schemas/traceroute.schema.js";
import type { Prisma } from "../generated/prisma/client.js";

const CACHE_TTL_MS = 60 * 60 * 1000;

type TracerouteWithHops = Prisma.TracerouteGetPayload<{
    include: { hops: true };
}>;

/**
 * Converts a `Traceroute` database row (with included hops) into the API
 * response shape consumed by the client.
 */
function toTracerouteResponse(row: TracerouteWithHops): TracerouteResponse {
    return {
        domain: row.domain,
        destinationIp: row.destinationIp,
        isCached: row.isCached,
        createdAt: row.createdAt.toISOString(),
        hops: row.hops.map((hop) => ({
            hopNumber: hop.hopNumber,
            ip: hop.ip,
            rtt1: hop.rtt1,
        })),
    };
}

/**
 * Creates a new `Traceroute` row with hops copied from an existing cached row.
 *
 * @param domain The domain being traced.
 * @param cached The existing cached traceroute row whose hops will be copied.
 * @param userId The authenticated user's database ID.
 * @returns The newly created (cached) row with included hops.
 */
async function createCachedCopy(
    domain: string,
    cached: TracerouteWithHops,
    userId: number,
): Promise<TracerouteWithHops> {
    return prisma.traceroute.create({
        data: {
            domain,
            destinationIp: cached.destinationIp,
            isCached: true,
            userId,
            hops: {
                create: cached.hops.map((hop) => ({
                    hopNumber: hop.hopNumber,
                    ip: hop.ip,
                    rtt1: hop.rtt1,
                })),
            },
        },
        include: { hops: true },
    });
}

/**
 * Persists a fresh traceroute result as a new `Traceroute` row.
 *
 * @param domain The domain being traced.
 * @param result The raw result from `runTraceroute`.
 * @param userId The authenticated user's database ID.
 * @returns The newly created row with included hops.
 */
async function persistFreshResult(
    domain: string,
    result: TracerouteResult,
    userId: number,
): Promise<TracerouteWithHops> {
    return prisma.traceroute.create({
        data: {
            domain,
            destinationIp: result.destinationIp.mapOr<string | null>(
                null,
                (ip) => ip,
            ),
            isCached: false,
            userId,
            hops: {
                create: result.hops.map((hop) => ({
                    hopNumber: hop.hopNumber,
                    ip: hop.ip,
                    rtt1: hop.rtt1.mapOr<number | null>(null, (v) => v),
                })),
            },
        },
        include: { hops: true },
    });
}

/**
 * Performs a traceroute lookup with a 1-hour database cache.
 *
 * Every call writes a `Traceroute` row to the database so the history
 * timeline is complete, even when the result is served from the cache.
 *
 * @param domain The domain name to trace.
 * @param userId The authenticated user's database ID.
 * @returns The traceroute response including hops, cache status, and timestamp.
 */
export async function performTraceroute(
    domain: string,
    userId: number,
): Promise<TracerouteResponse> {
    const cacheThreshold = new Date(Date.now() - CACHE_TTL_MS);

    const cached = await prisma.traceroute.findFirst({
        where: {
            domain,
            createdAt: { gte: cacheThreshold },
        },
        include: { hops: true },
        orderBy: { createdAt: "desc" },
    });

    if (cached) {
        const lookup = await createCachedCopy(domain, cached, userId);
        return toTracerouteResponse(lookup);
    }

    const result = await runTraceroute(domain);
    const lookup = await persistFreshResult(domain, result, userId);
    return toTracerouteResponse(lookup);
}
