/**
 * @file whois.schema.ts
 * @fileoverview Zod schemas for validating WHOIS API requests and responses.
 *
 * @author Ozan Malcı
 */
import * as z from "zod";
import { lookupQuerySchema } from "./lookup.schema.js";

export const whoisQuerySchema = lookupQuerySchema;

export const whoisResponseSchema = z.object({
    domain: z.string(),
    registrar: z.string().nullable(),
    creationDate: z.string().nullable(),
    expirationDate: z.string().nullable(),
    nameServers: z.array(z.string()),
    rawData: z.string(),
    isCached: z.boolean(),
    createdAt: z.string(),
});

export type WhoisQuery = z.infer<typeof whoisQuerySchema>;
export type WhoisResponse = z.infer<typeof whoisResponseSchema>;
