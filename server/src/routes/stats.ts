/**
 * @file stats.ts
 * @fileoverview Route handler for the per-user statistics endpoint. Returns
 * all-time aggregate stats across DNS, traceroute, WHOIS, and ASN lookups
 * for the authenticated user.
 *
 * @author Ozan Malcı
 */
import type { Context } from "hono";
import { getStats } from "../services/statsService.js";
import type { AppEnv } from "../types/app.js";

/**
 * Handles GET /api/stats requests.
 *
 * Pulls the authenticated `userId` from the Hono context and delegates to
 * `getStats`.
 *
 * @param ctx The Hono context.
 * @returns A JSON response containing the aggregated stats.
 */
export async function statsHandler(ctx: Context<AppEnv>): Promise<Response> {
    const { userId } = ctx.get("authUser");
    return ctx.json(await getStats(userId));
}
