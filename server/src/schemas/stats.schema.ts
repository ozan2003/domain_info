/**
 * @file stats.schema.ts
 * @fileoverview Zod schemas for the per-user statistics endpoint. All stats
 * are all-time aggregates (no time-range filter in v1) scoped to the
 * authenticated user.
 *
 * @author Ozan Malcı
 */
import * as z from "zod";

const cacheHitRatioSchema = z.object({
    total: z.int().nonnegative(),
    cached: z.int().nonnegative(),
    ratio: z.number().min(0).max(1),
});

const topDomainEntrySchema = z.object({
    domain: z.string(),
    count: z.int().nonnegative(),
});

const topRegistrarEntrySchema = z.object({
    registrar: z.string(),
    count: z.int().nonnegative(),
});

const topAsnEntrySchema = z.object({
    asNumber: z.int().nullable(),
    asName: z.string().nullable(),
    count: z.int().nonnegative(),
});

const topFirstHopEntrySchema = z.object({
    ip: z.string(),
    count: z.int().nonnegative(),
});

export const statsResponseSchema = z.object({
    totals: z.object({
        dns: z.int().nonnegative(),
        traceroute: z.int().nonnegative(),
        whois: z.int().nonnegative(),
        asn: z.int().nonnegative(),
    }),
    cacheHitRatio: z.object({
        dns: cacheHitRatioSchema,
        traceroute: cacheHitRatioSchema,
        whois: cacheHitRatioSchema,
        asn: cacheHitRatioSchema,
    }),
    topDomains: z.object({
        dns: z.array(topDomainEntrySchema),
        traceroute: z.array(topDomainEntrySchema),
        whois: z.array(topDomainEntrySchema),
    }),
    traceroute: z.object({
        avgHopCount: z.number().nullable(),
        topFirstHops: z.array(topFirstHopEntrySchema),
    }),
    whois: z.object({
        topRegistrars: z.array(topRegistrarEntrySchema),
    }),
    asn: z.object({
        topAsns: z.array(topAsnEntrySchema),
    }),
});

export type CacheHitRatio = z.infer<typeof cacheHitRatioSchema>;
export type TopDomainEntry = z.infer<typeof topDomainEntrySchema>;
export type TopRegistrarEntry = z.infer<typeof topRegistrarEntrySchema>;
export type TopAsnEntry = z.infer<typeof topAsnEntrySchema>;
export type TopFirstHopEntry = z.infer<typeof topFirstHopEntrySchema>;
export type StatsResponse = z.infer<typeof statsResponseSchema>;
