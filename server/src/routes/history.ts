/**
 * @file history.ts
 * @fileoverview Route handler for the lookup history endpoint. Returns a
 * flat, paginated timeline of all lookup types (DNS, traceroute, WHOIS, ASN)
 * for the authenticated user, sorted by `createdAt` desc.
 *
 * @author Ozan Malcı
 */
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { historyQuerySchema } from "../schemas/history.schema.js";
import { getHistory, getHistoryDetail } from "../services/historyService.js";
import { parseQuery } from "../lib/validate.js";
import type { AppEnv } from "../types/app.js";
import {
    MISSING_KIND_ID_ERROR_MSG,
    INVALID_ID_ERROR_MSG,
} from "../constants.js";

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

/**
 * Handles GET /api/history/:kind/:id requests.
 *
 * Validates the kind and id path parameters, pulls the authenticated
 * `userId` from the Hono context, and delegates to `getHistoryDetail`.
 *
 * @param ctx The Hono context.
 * @returns A JSON response containing the full lookup detail.
 */
export async function historyDetailHandler(
    ctx: Context<AppEnv>,
): Promise<Response> {
    const kind = ctx.req.param("kind");
    const rawId = ctx.req.param("id");

    if (!kind || !rawId) {
        throw new HTTPException(400, { message: MISSING_KIND_ID_ERROR_MSG });
    }
    const { userId } = ctx.get("authUser");

    const id = Number(rawId);
    if (!Number.isInteger(id) || id <= 0) {
        throw new HTTPException(400, { message: INVALID_ID_ERROR_MSG(rawId) });
    }

    return ctx.json(await getHistoryDetail(kind, id, userId));
}
