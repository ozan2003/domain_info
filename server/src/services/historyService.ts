/**
 * @file historyService.ts
 * @fileoverview Builds a flat, per-user, paginated timeline across all lookup
 * types (DNS, traceroute, WHOIS, ASN). Each item in the timeline is a
 * discriminated union on `kind` so the client can render each row
 * differently without separate endpoints.
 *
 * Pagination strategy: for each of the four lookup tables we take
 * `page * pageSize` rows ordered by `createdAt` desc, merge, re-sort, and
 * slice to the requested page. This is slightly wasteful on later pages
 * but correct and simple. Switch to cursor-based pagination if/when
 * per-user row counts grow large.
 *
 * The list view intentionally omits child record arrays (DNS records, hop
 * rows, WHOIS `rawData`) — those are fetched on detail. Only summary
 * fields are returned to keep the payload small.
 *
 * @author Ozan Malcı
 */
import { HTTPException } from "hono/http-exception";
import { prisma } from "../db.js";
import type { Prisma } from "../generated/prisma/client.js";
import type {
    AsnHistoryItem,
    DnsHistoryItem,
    HistoryItem,
    HistoryResponse,
    TracerouteHistoryItem,
    WhoisHistoryItem,
} from "../schemas/history.schema.js";
import type { LookupResponse } from "../schemas/lookup.schema.js";
import type { TracerouteResponse } from "../schemas/traceroute.schema.js";
import type { WhoisResponse } from "../schemas/whois.schema.js";
import type { AsnResponse } from "../schemas/asn.schema.js";

/**
 * Projects a `Lookup` row (with record counts) into a DNS history item.
 *
 * @param row The Lookup row including count-only record relations.
 * @returns The DnsHistoryItem for the timeline.
 */
function toDnsItem(
    row: Prisma.LookupGetPayload<{
        include: {
            _count: {
                select: {
                    aRecords: true;
                    aaaaRecords: true;
                    mxRecords: true;
                    nsRecords: true;
                    txtRecords: true;
                    cnameRecords: true;
                };
            };
        };
    }>,
): DnsHistoryItem {
    return {
        kind: "dns",
        id: row.id,
        domain: row.domain,
        isCached: row.isCached,
        createdAt: row.createdAt.toISOString(),
        recordCounts: {
            a: row._count.aRecords,
            aaaa: row._count.aaaaRecords,
            mx: row._count.mxRecords,
            ns: row._count.nsRecords,
            txt: row._count.txtRecords,
            cname: row._count.cnameRecords,
        },
    };
}

/**
 * Projects a Traceroute row into a history item (no hops — just `hopCount`).
 *
 * @param row The Traceroute row.
 * @returns The TracerouteHistoryItem for the timeline.
 */
function toTracerouteItem(row: {
    id: number;
    domain: string;
    destinationIp: string | null;
    isCached: boolean;
    hopCount: number;
    createdAt: Date;
}): TracerouteHistoryItem {
    return {
        kind: "traceroute",
        id: row.id,
        domain: row.domain,
        destinationIp: row.destinationIp,
        isCached: row.isCached,
        hopCount: row.hopCount,
        createdAt: row.createdAt.toISOString(),
    };
}

/**
 * Projects a Whois row into a history item (omits `rawData`).
 *
 * @param row The Whois row.
 * @returns The WhoisHistoryItem for the timeline.
 */
function toWhoisItem(row: {
    id: number;
    domain: string;
    registrar: string | null;
    isCached: boolean;
    createdAt: Date;
}): WhoisHistoryItem {
    return {
        kind: "whois",
        id: row.id,
        domain: row.domain,
        registrar: row.registrar,
        isCached: row.isCached,
        createdAt: row.createdAt.toISOString(),
    };
}

/**
 * Projects an ASNLookup row into a history item.
 *
 * @param row The ASNLookup row.
 * @returns The AsnHistoryItem for the timeline.
 */
function toAsnItem(row: {
    id: number;
    ip: string;
    asNumber: number | null;
    asName: string | null;
    prefix: string | null;
    isCached: boolean;
    createdAt: Date;
}): AsnHistoryItem {
    return {
        kind: "asn",
        id: row.id,
        ip: row.ip,
        asNumber: row.asNumber,
        asName: row.asName,
        prefix: row.prefix,
        isCached: row.isCached,
        createdAt: row.createdAt.toISOString(),
    };
}

/**
 * Returns the user's paginated lookup history as a flat, time-sorted timeline
 * across all four lookup types. Items are shaped for list rendering — no
 * nested child record arrays, those fetch on detail.
 *
 * @param userId The authenticated user's database ID.
 * @param page The 1-indexed page number.
 * @param pageSize The page size (1–100).
 * @returns The page of history items plus pagination metadata.
 */
export async function getHistory(
    userId: number,
    page: number,
    pageSize: number,
): Promise<HistoryResponse> {
    const take = page * pageSize + 1;

    const [lookups, traceroutes, whois, asn] = await Promise.all([
        prisma.lookup.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take,
            include: {
                _count: {
                    select: {
                        aRecords: true,
                        aaaaRecords: true,
                        mxRecords: true,
                        nsRecords: true,
                        txtRecords: true,
                        cnameRecords: true,
                    },
                },
            },
        }),
        prisma.traceroute.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take,
        }),
        prisma.whois.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take,
        }),
        prisma.aSNLookup.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take,
        }),
    ]);

    const items: HistoryItem[] = [
        ...lookups.map(toDnsItem),
        ...traceroutes.map(toTracerouteItem),
        ...whois.map(toWhoisItem),
        ...asn.map(toAsnItem),
    ];

    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const pageItems = items.slice(start, end);
    const hasMore = end < items.length;

    return {
        items: pageItems,
        page,
        pageSize,
        hasMore,
    };
}

const VALID_KINDS = new Set(["dns", "traceroute", "whois", "asn"]);

export type HistoryDetail =
    | LookupResponse
    | TracerouteResponse
    | WhoisResponse
    | AsnResponse;

/**
 * Fetches the full detail for a single history item by kind and ID.
 *
 * Scoped to the authenticated user so users cannot view each other's data.
 * Throws HTTPException(400) for invalid kinds and HTTPException(404) when
 * the record does not exist or belongs to a different user.
 *
 * @param kind The lookup kind ("dns" | "traceroute" | "whois" | "asn").
 * @param id The database row ID.
 * @param userId The authenticated user's database ID.
 * @returns The full response shape for the requested history item.
 */
export async function getHistoryDetail(
    kind: string,
    id: number,
    userId: number,
): Promise<HistoryDetail> {
    if (!VALID_KINDS.has(kind)) {
        throw new HTTPException(400, { message: `Invalid kind: ${kind}` });
    }

    switch (kind) {
        case "dns": {
            const row = await prisma.lookup.findUnique({
                where: { id, userId },
                include: {
                    aRecords: true,
                    aaaaRecords: true,
                    mxRecords: true,
                    nsRecords: true,
                    txtRecords: true,
                    cnameRecords: true,
                },
            });
            if (!row) {
                throw new HTTPException(404, {
                    message: "History item not found",
                });
            }
            return {
                domain: row.domain,
                isCached: row.isCached,
                createdAt: row.createdAt.toISOString(),
                a: row.aRecords.map((a) => a.address),
                aaaa: row.aaaaRecords.map((aaaa) => aaaa.address),
                mx: row.mxRecords.map((mx) => ({
                    exchange: mx.exchange,
                    priority: mx.priority,
                })),
                ns: row.nsRecords.map((ns) => ns.nameserver),
                txt: row.txtRecords.map((txt) => txt.value),
                cname: row.cnameRecords.map((cname) => cname.value),
            };
        }
        case "traceroute": {
            const row = await prisma.traceroute.findUnique({
                where: { id, userId },
                include: { hops: true },
            });
            if (!row) {
                throw new HTTPException(404, {
                    message: "History item not found",
                });
            }
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
        case "whois": {
            const row = await prisma.whois.findUnique({
                where: { id, userId },
            });
            if (!row) {
                throw new HTTPException(404, {
                    message: "History item not found",
                });
            }
            return {
                domain: row.domain,
                registrar: row.registrar,
                creationDate: row.creationDate,
                expirationDate: row.expirationDate,
                nameServers: row.nameServers
                    ? row.nameServers
                          .split(/\r?\n/)
                          .map((s) => s.trim())
                          .filter(Boolean)
                    : [],
                rawData: row.rawData,
                isCached: row.isCached,
                createdAt: row.createdAt.toISOString(),
            };
        }
        case "asn": {
            const row = await prisma.aSNLookup.findUnique({
                where: { id, userId },
            });
            if (!row) {
                throw new HTTPException(404, {
                    message: "History item not found",
                });
            }
            return {
                ip: row.ip,
                asNumber: row.asNumber,
                asName: row.asName,
                prefix: row.prefix,
                isCached: row.isCached,
                createdAt: row.createdAt.toISOString(),
            };
        }
        default:
            throw new HTTPException(400, {
                message: `Invalid kind: ${kind}`,
            });
    }
}
