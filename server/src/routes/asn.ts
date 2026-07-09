/**
 * @file asn.ts
 * @fileoverview Route handler for ASN lookup requests.
 *
 * @author Ozan Malcı
 */
import type { Context } from "hono";
import { asnQuerySchema } from "../schemas/asn.schema.js";
import { performAsnLookup } from "../services/asnCacheService.js";
import { parseQuery } from "../lib/validate.js";
import type { AppEnv } from "../types/app.js";

/**
 * Handles GET /api/asn requests by validating the query and performing an
 * ASN lookup scoped to the calling user.
 *
 * @param ctx The Hono context.
 * @returns A JSON response containing ASN data for the requested IP.
 */
export async function asnHandler(ctx: Context<AppEnv>): Promise<Response> {
    const { ip } = parseQuery(ctx, asnQuerySchema);
    const { userId } = ctx.get("authUser");
    return ctx.json(await performAsnLookup(ip, userId));
}
