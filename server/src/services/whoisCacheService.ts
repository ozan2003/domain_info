/**
 * @file whoisCacheService.ts
 * @fileoverview Orchestrates WHOIS lookups with a 1-hour database cache.
 *
 * @author Ozan Malcı
 */
import { prisma } from "../db.js";
import type { Prisma } from "../generated/prisma/client.js";
import type { WhoisResponse } from "../schemas/whois.schema.js";
import { match, Option } from "oxide.ts";
import { lookupWhois, type WhoisLookupResult } from "./whoisService.js";

const CACHE_TTL_MS = 60 * 60 * 1000;

type WhoisWithRow = Prisma.WhoisGetPayload<{
    select: {
        domain: true;
        registrar: true;
        creationDate: true;
        expirationDate: true;
        nameServers: true;
        rawData: true;
        isCached: true;
        createdAt: true;
    };
}>;

function splitNameServers(nameServers: Option<string>): string[] {
    return match(nameServers, {
        Some: (nameServers) => {
            return nameServers
                .split(/\r?\n/)
                .map((nameServer) => nameServer.trim())
                .filter(Boolean);
        },
        None: () => [],
    });
}

function toWhoisResponse(row: WhoisWithRow): WhoisResponse {
    return {
        domain: row.domain,
        registrar: row.registrar,
        creationDate: row.creationDate,
        expirationDate: row.expirationDate,
        nameServers: splitNameServers(Option.from(row.nameServers)),
        rawData: row.rawData,
        isCached: row.isCached,
        createdAt: row.createdAt.toISOString(),
    };
}

async function createCachedCopy(
    domain: string,
    cached: WhoisWithRow,
    userId: number | undefined,
): Promise<WhoisWithRow> {
    return prisma.whois.create({
        data: {
            domain,
            rawData: cached.rawData,
            registrar: cached.registrar,
            creationDate: cached.creationDate,
            expirationDate: cached.expirationDate,
            nameServers: cached.nameServers,
            isCached: true,
            ...Option.from(userId).mapOr<object>({}, (id) => ({
                userId: id,
            })),
        },
        select: {
            domain: true,
            registrar: true,
            creationDate: true,
            expirationDate: true,
            nameServers: true,
            rawData: true,
            isCached: true,
            createdAt: true,
        },
    });
}

async function persistFreshResult(
    domain: string,
    result: WhoisLookupResult,
    userId: number | undefined,
): Promise<WhoisWithRow> {
    return prisma.whois.create({
        data: {
            domain,
            rawData: result.rawData,
            registrar: result.registrar.mapOr<string | null>(null, (v) => v),
            creationDate: result.creationDate.mapOr<string | null>(
                null,
                (v) => v,
            ),
            expirationDate: result.expirationDate.mapOr<string | null>(
                null,
                (v) => v,
            ),
            nameServers: result.nameServers.join("\n"),
            isCached: false,
            ...Option.from(userId).mapOr<object>({}, (id) => ({
                userId: id,
            })),
        },
        select: {
            domain: true,
            registrar: true,
            creationDate: true,
            expirationDate: true,
            nameServers: true,
            rawData: true,
            isCached: true,
            createdAt: true,
        },
    });
}

/**
 * Performs a WHOIS lookup with a 1-hour database cache.
 *
 * @param domain The domain to look up.
 * @param userId The authenticated user's database ID.
 * @returns The normalized WHOIS response.
 */
export async function performWhoisLookup(
    domain: string,
    userId: number | undefined,
): Promise<WhoisResponse> {
    const cacheThreshold = new Date(Date.now() - CACHE_TTL_MS);

    const cached = await prisma.whois.findFirst({
        where: {
            domain,
            createdAt: { gte: cacheThreshold },
        },
        orderBy: { createdAt: "desc" },
        select: {
            domain: true,
            registrar: true,
            creationDate: true,
            expirationDate: true,
            nameServers: true,
            rawData: true,
            isCached: true,
            createdAt: true,
        },
    });

    if (cached) {
        const copy = await createCachedCopy(domain, cached, userId);
        return toWhoisResponse(copy);
    }

    const result = await lookupWhois(domain);
    const row = await persistFreshResult(domain, result, userId);
    return toWhoisResponse(row);
}
