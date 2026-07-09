/**
 * @file whois.ts
 * @fileoverview Route handler for WHOIS requests.
 *
 * @author Ozan Malcı
 */
import type { Context } from "hono";
import { whoisQuerySchema } from "../schemas/whois.schema.js";
import { performWhoisLookup } from "../services/whoisCacheService.js";
import { parseQuery } from "../lib/validate.js";
import type { AppEnv } from "../types/app.js";

/**
 * Handles GET /api/whois requests.
 *
 * @param ctx The Hono context.
 * @returns A JSON response containing WHOIS data.
 */
export async function whoisHandler(ctx: Context<AppEnv>): Promise<Response> {
    const { domain } = parseQuery(ctx, whoisQuerySchema);
    const { userId } = ctx.get("authUser");
    return ctx.json(await performWhoisLookup(domain, userId));
}
