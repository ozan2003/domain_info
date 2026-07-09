/**
 * @file lookup.ts
 * @fileoverview Route handler for DNS lookup requests. Validates query parameters and invokes the lookup service.
 *
 * @author Ozan Malcı
 */
import type { Context } from "hono";
import { lookupQuerySchema } from "../schemas/lookup.schema.js";
import { performLookup } from "../services/lookupService.js";
import { parseQuery } from "../lib/validate.js";
import type { AppEnv } from "../types/app.js";

/**
 * Handles GET /api/lookup requests by validating the query and resolving DNS records.
 *
 * @param ctx The Hono context.
 * @returns A JSON response containing the DNS records.
 */
export async function lookupHandler(ctx: Context<AppEnv>): Promise<Response> {
    const { domain } = parseQuery(ctx, lookupQuerySchema);
    const { userId } = ctx.get("authUser");
    return ctx.json(await performLookup(domain, userId));
}
