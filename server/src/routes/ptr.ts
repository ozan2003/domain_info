import type { Context } from "hono";
import { ptrQuerySchema } from "../schemas/ptr.schema.js";
import { lookupPtr } from "../services/dnsService.js";
import { parseQuery } from "../lib/validate.js";
import type { AppEnv } from "../types/app.js";

/**
 * Handles GET /api/ptr requests by validating the query and resolving the
 * PTR (reverse DNS) hostnames for the given IP.
 *
 * @param ctx The Hono context.
 * @returns A JSON response containing the IP and its resolved hostnames.
 */
export async function ptrHandler(ctx: Context<AppEnv>): Promise<Response> {
    const { ip } = parseQuery(ctx, ptrQuerySchema);
    const hostnames = await lookupPtr(ip);
    return ctx.json({ ip, hostnames });
}
