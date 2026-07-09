/**
 * @file asn.schema.ts
 * @fileoverview Zod schemas for validating ASN API requests and responses.
 *
 * @author Ozan Malcı
 */
import * as z from "zod";
import { isIP } from "node:net";

export const asnQuerySchema = z.object({
    ip: z
        .string()
        .trim()
        .min(1, "ip is required")
        .refine((value) => isIP(value) !== 0, "invalid ip address"),
});

export const asnResponseSchema = z.object({
    ip: z.string(),
    asNumber: z.int().nullable(),
    asName: z.string().nullable(),
    prefix: z.string().nullable(),
    isCached: z.boolean(),
    createdAt: z.string(),
});

export type AsnQuery = z.infer<typeof asnQuerySchema>;
export type AsnResponse = z.infer<typeof asnResponseSchema>;
