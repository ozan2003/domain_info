/**
 * @file lookup.schema.ts
 * @fileoverview Zod schemas for validating DNS lookup queries and responses in runtime.
 *
 * @author Ozan Malcı
 */
import * as z from "zod";

export const lookupQuerySchema = z.object({
    domain: z
        .hostname()
        .trim()
        .min(1, "domain is required")
        // 253 is the max length of a DNS name.
        // https://web.archive.org/web/20190518124533/https://devblogs.microsoft.com/oldnewthing/?p=7873
        .max(253, "domain is too long"),
});

// Zod schema used for runtime validation. So we can't use `MxRecord` from `node:dns`.
export const mxRecordSchema = z.object({
    exchange: z.string(),
    priority: z.int().nonnegative().max(65535), // The preference number is an u16 (RFC 1035).
});

export const lookupResponseSchema = z.object({
    domain: z.string(),
    isCached: z.boolean(),
    createdAt: z.string(),
    a: z.array(z.string()),
    aaaa: z.array(z.string()),
    mx: z.array(mxRecordSchema),
    ns: z.array(z.string()),
    txt: z.array(z.string()),
    cname: z.array(z.string()),
});

export type LookupQuery = z.infer<typeof lookupQuerySchema>;
export type LookupResponse = z.infer<typeof lookupResponseSchema>;
export type MXRecord = z.infer<typeof mxRecordSchema>;
export type DnsLookupResult = {
    domain: string;
    a: string[];
    aaaa: string[];
    mx: MXRecord[];
    ns: string[];
    txt: string[];
    cname: string[];
};
