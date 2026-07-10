/**
 * @file statsService.ts
 * @fileoverview Per-user, all-time aggregate statistics across all four
 * lookup types (DNS, traceroute, WHOIS, ASN). Every query is scoped to the
 * authenticated `userId` so users only see their own data.
 *
 * Metrics returned:
 *  - totals per type
 *  - cache hit ratio per type (`cached / total`)
 *  - top 10 most-queried domains per type (DNS, traceroute, WHOIS)
 *  - traceroute: average hop count + top 10 first-hop IPs
 *  - WHOIS: top 10 registrars
 *  - ASN: top 10 AS numbers
 *
 * Note on cache-copy inflation: because the cache-hit pattern writes a new
 * row per user request, the `groupBy` counts include both canonical
 * (isCached=false) and copy (isCached=true) rows for the same domain/IP.
 * This is a known and acceptable inaccuracy for a stats view; counts are
 * still useful as relative rankings.
 *
 * @author Ozan Malcı
 */
import { prisma } from "../db.js";
import type {
    CacheHitRatio,
    StatsResponse,
    TopAsnEntry,
    TopDomainEntry,
    TopFirstHopEntry,
    TopRegistrarEntry,
} from "../schemas/stats.schema.js";

const TOP_N = 10;

/**
 * Computes cache hit ratio for a lookup type, scoped to a user.
 *
 * @param total The total row count for the user.
 * @param cached The cached row count for the user.
 * @returns The total, cached count, and ratio in [0, 1] (0 if no rows).
 */
function makeHitRatio(total: number, cached: number): CacheHitRatio {
    return {
        total,
        cached,
        ratio: total === 0 ? 0 : cached / total,
    };
}

/**
 * Runs two counts in parallel: total rows and cached rows for a given model.
 *
 * @param totalP The promise resolving to the total count.
 * @param cachedP The promise resolving to the cached count.
 * @returns The total and cached counts.
 */
async function pairedCount(
    totalP: Promise<number>,
    cachedP: Promise<number>,
): Promise<{ total: number; cached: number }> {
    const [total, cached] = await Promise.all([totalP, cachedP]);
    return { total, cached };
}

/**
 * Maps a Prisma groupBy result to a list of `{ key, count }` entries.
 *
 * @param groups The raw groupBy rows. Each must have a `_count: { _all: number }`.
 * @param keyOf Extracts the grouping key from a row.
 * @returns The mapped entries.
 */
function mapGroups<
    T extends { _count: { _all: number } },
    K extends string | number,
>(groups: T[], keyOf: (group: T) => K): { key: K; count: number }[] {
    return groups.map((g) => ({ key: keyOf(g), count: g._count._all }));
}

/**
 * Returns the user's all-time aggregate stats across DNS, traceroute,
 * WHOIS, and ASN lookups.
 *
 * @param userId The authenticated user's database ID.
 * @returns The aggregated stats object ready for the API response.
 */
export async function getStats(userId: number): Promise<StatsResponse> {
    const where = { userId };

    const [
        dnsTotal,
        dnsCached,
        trTotal,
        trCached,
        whoisTotal,
        whoisCached,
        asnTotal,
        asnCached,
        dnsDomainGroups,
        trDomainGroups,
        whoisDomainGroups,
        trAvg,
        firstHopGroups,
        registrarGroups,
        asnGroups,
    ] = await Promise.all([
        prisma.lookup.count({ where }),
        prisma.lookup.count({ where: { ...where, isCached: true } }),
        prisma.traceroute.count({ where }),
        prisma.traceroute.count({ where: { ...where, isCached: true } }),
        prisma.whois.count({ where }),
        prisma.whois.count({ where: { ...where, isCached: true } }),
        prisma.aSNLookup.count({ where }),
        prisma.aSNLookup.count({ where: { ...where, isCached: true } }),
        prisma.lookup.groupBy({
            by: ["domain"],
            where,
            _count: { _all: true },
            orderBy: { _count: { domain: "desc" } },
            take: TOP_N,
        }),
        prisma.traceroute.groupBy({
            by: ["domain"],
            where,
            _count: { _all: true },
            orderBy: { _count: { domain: "desc" } },
            take: TOP_N,
        }),
        prisma.whois.groupBy({
            by: ["domain"],
            where,
            _count: { _all: true },
            orderBy: { _count: { domain: "desc" } },
            take: TOP_N,
        }),
        prisma.traceroute.aggregate({
            where,
            _avg: { hopCount: true },
        }),
        prisma.hop.groupBy({
            by: ["ip"],
            where: { hopNumber: 1, traceroute: { userId } },
            _count: { _all: true },
            orderBy: { _count: { ip: "desc" } },
            take: TOP_N,
        }),
        prisma.whois.groupBy({
            by: ["registrar"],
            where: { ...where, registrar: { not: null } },
            _count: { _all: true },
            orderBy: { _count: { registrar: "desc" } },
            take: TOP_N,
        }),
        prisma.aSNLookup.groupBy({
            by: ["asNumber", "asName"],
            where,
            _count: { _all: true },
            orderBy: { _count: { asNumber: "desc" } },
            take: TOP_N,
        }),
    ]);

    const [dns, tr, whois, asn] = await Promise.all([
        pairedCount(Promise.resolve(dnsTotal), Promise.resolve(dnsCached)),
        pairedCount(Promise.resolve(trTotal), Promise.resolve(trCached)),
        pairedCount(Promise.resolve(whoisTotal), Promise.resolve(whoisCached)),
        pairedCount(Promise.resolve(asnTotal), Promise.resolve(asnCached)),
    ]);

    const topDomains = {
        dns: mapGroups(dnsDomainGroups, (g) => g.domain).map<TopDomainEntry>(
            ({ key, count }) => ({ domain: key, count }),
        ),
        traceroute: mapGroups(
            trDomainGroups,
            (g) => g.domain,
        ).map<TopDomainEntry>(({ key, count }) => ({ domain: key, count })),
        whois: mapGroups(
            whoisDomainGroups,
            (g) => g.domain,
        ).map<TopDomainEntry>(({ key, count }) => ({ domain: key, count })),
    };

    const topFirstHops: TopFirstHopEntry[] = firstHopGroups.map((g) => ({
        ip: g.ip,
        count: g._count._all,
    }));

    const topRegistrars: TopRegistrarEntry[] = registrarGroups
        .filter(
            (g): g is typeof g & { registrar: string } => g.registrar !== null,
        )
        .map((g) => ({
            registrar: g.registrar,
            count: g._count._all,
        }));

    const topAsns: TopAsnEntry[] = asnGroups.map((g) => ({
        asNumber: g.asNumber,
        asName: g.asName,
        count: g._count._all,
    }));

    return {
        totals: {
            dns: dns.total,
            traceroute: tr.total,
            whois: whois.total,
            asn: asn.total,
        },
        cacheHitRatio: {
            dns: makeHitRatio(dns.total, dns.cached),
            traceroute: makeHitRatio(tr.total, tr.cached),
            whois: makeHitRatio(whois.total, whois.cached),
            asn: makeHitRatio(asn.total, asn.cached),
        },
        topDomains,
        traceroute: {
            avgHopCount: trAvg._avg.hopCount,
            topFirstHops,
        },
        whois: {
            topRegistrars,
        },
        asn: {
            topAsns,
        },
    };
}
