/**
 * @file asn.schema.ts
 * @fileoverview Zod schemas for validating ASN API requests and responses.
 *
 * @author Ozan Malcı
 */
import * as z from "zod";
import { isIP } from "node:net";
import { INVALID_IP_ERROR_MSG, REQUIRED_IP_ERROR_MSG } from "../constants.js";

export const asnQuerySchema = z.object({
    ip: z
        .string()
        .trim()
        .min(1, REQUIRED_IP_ERROR_MSG)
        .refine((value) => isIP(value) !== 0, INVALID_IP_ERROR_MSG),
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
