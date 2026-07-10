/**
 * @file history.schema.ts
 * @fileoverview Zod schemas for the history API. Validates query params and
 * shapes the response as a flat, paginated timeline of all lookup types
 * (DNS, traceroute, WHOIS, ASN) for the authenticated user, sorted by
 * `createdAt` descending.
 *
 * @author Ozan Malcı
 */
import * as z from "zod";

export const historyQuerySchema = z.object({
    // Zod says int() is deprecated z.coerce ain't have it.
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(25),
});

export const dnsHistoryItemSchema = z.object({
    kind: z.literal("dns"),
    id: z.int(),
    domain: z.string(),
    isCached: z.boolean(),
    createdAt: z.string(),
    recordCounts: z.object({
        a: z.int().nonnegative(),
        aaaa: z.int().nonnegative(),
        mx: z.int().nonnegative(),
        ns: z.int().nonnegative(),
        txt: z.int().nonnegative(),
        cname: z.int().nonnegative(),
    }),
});

export const tracerouteHistoryItemSchema = z.object({
    kind: z.literal("traceroute"),
    id: z.int(),
    domain: z.string(),
    destinationIp: z.string().nullable(),
    isCached: z.boolean(),
    hopCount: z.int().nonnegative(),
    createdAt: z.string(),
});

export const whoisHistoryItemSchema = z.object({
    kind: z.literal("whois"),
    id: z.int(),
    domain: z.string(),
    registrar: z.string().nullable(),
    isCached: z.boolean(),
    createdAt: z.string(),
});

export const asnHistoryItemSchema = z.object({
    kind: z.literal("asn"),
    id: z.int(),
    ip: z.string(),
    asNumber: z.int().nullable(),
    asName: z.string().nullable(),
    prefix: z.string().nullable(),
    isCached: z.boolean(),
    createdAt: z.string(),
});

export const historyItemSchema = z.discriminatedUnion("kind", [
    dnsHistoryItemSchema,
    tracerouteHistoryItemSchema,
    whoisHistoryItemSchema,
    asnHistoryItemSchema,
]);

export const historyResponseSchema = z.object({
    items: z.array(historyItemSchema),
    page: z.int().positive(),
    pageSize: z.int().positive(),
    hasMore: z.boolean(),
});

export type HistoryQuery = z.infer<typeof historyQuerySchema>;
export type DnsHistoryItem = z.infer<typeof dnsHistoryItemSchema>;
export type TracerouteHistoryItem = z.infer<typeof tracerouteHistoryItemSchema>;
export type WhoisHistoryItem = z.infer<typeof whoisHistoryItemSchema>;
export type AsnHistoryItem = z.infer<typeof asnHistoryItemSchema>;
export type HistoryItem = z.infer<typeof historyItemSchema>;
export type HistoryResponse = z.infer<typeof historyResponseSchema>;
