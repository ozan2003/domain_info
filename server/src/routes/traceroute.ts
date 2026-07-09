/**
 * @file traceroute.ts
 * @fileoverview Route handler for traceroute requests. Validates the domain
 * query parameter and delegates to the traceroute cache service.
 *
 * @author Ozan Malcı
 */
import type { Context } from "hono";
import { lookupQuerySchema } from "../schemas/lookup.schema.js";
import { performTraceroute } from "../services/tracerouteCacheService.js";
import { parseQuery } from "../lib/validate.js";
import type { AppEnv } from "../types/app.js";

/**
 * Handles `GET /api/traceroute` requests.
 *
 * Validates the `domain` query parameter against the shared `lookupQuerySchema`,
 * pulls the authenticated `userId` from the Hono context, and delegates to
 * `performTraceroute`.
 *
 * @param ctx The Hono context.
 * @returns A JSON response containing the traceroute result.
 */
export async function tracerouteHandler(
    ctx: Context<AppEnv>,
): Promise<Response> {
    const { domain } = parseQuery(ctx, lookupQuerySchema);
    const { userId } = ctx.get("authUser");
    return ctx.json(await performTraceroute(domain, userId));
}
