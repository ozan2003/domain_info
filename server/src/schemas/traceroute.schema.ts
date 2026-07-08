/**
 * @file traceroute.schema.ts
 * @fileoverview Zod schemas for validating traceroute API responses at runtime.
 *
 * @author Ozan Malcı
 */
import * as z from "zod";

export const tracerouteHopSchema = z.object({
    hopNumber: z.int().nonnegative(),
    ip: z.string(),
    rtt1: z.number().nullable(),
});

export const tracerouteResponseSchema = z.object({
    domain: z.string(),
    destinationIp: z.string().nullable(),
    isCached: z.boolean(),
    createdAt: z.string(),
    hops: z.array(tracerouteHopSchema),
});

export type TracerouteResponse = z.infer<typeof tracerouteResponseSchema>;
export type TracerouteHop = z.infer<typeof tracerouteHopSchema>;
