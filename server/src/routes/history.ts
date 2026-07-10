/**
 * @file history.ts
 * @fileoverview Route handler for the lookup history endpoint. Returns a
 * flat, paginated timeline of all lookup types (DNS, traceroute, WHOIS, ASN)
 * for the authenticated user, sorted by `createdAt` desc.
 *
 * @author Ozan Malcı
 */
import type { Context } from "hono";
import { historyQuerySchema } from "../schemas/history.schema.js";
import { getHistory } from "../services/historyService.js";
import { parseQuery } from "../lib/validate.js";
import type { AppEnv } from "../types/app.js";

/**
 * Handles GET /api/history requests.
 *
 * Validates the `page` and `pageSize` query parameters, pulls the
 * authenticated `userId` from the Hono context, and delegates to
 * `getHistory`.
 *
 * @param ctx The Hono context.
 * @returns A JSON response containing the paginated history timeline.
 */
export async function historyHandler(ctx: Context<AppEnv>): Promise<Response> {
    const { page, pageSize } = parseQuery(ctx, historyQuerySchema);
    const { userId } = ctx.get("authUser");
    return ctx.json(await getHistory(userId, page, pageSize));
}
