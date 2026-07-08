/**
 * @file traceroute.ts
 * @fileoverview Route handler for traceroute requests. Validates the domain
 * query parameter and delegates to the traceroute cache service.
 *
 * @author Ozan Malcı
 */
import { Option } from "oxide.ts";
import { HTTPException } from "hono/http-exception";
import { lookupQuerySchema } from "../schemas/lookup.schema.js";
import type { TracerouteResponse } from "../schemas/traceroute.schema.js";
import { performTraceroute } from "../services/tracerouteCacheService.js";
import type { AppEnv } from "../types/app.js";
import type { Context } from "hono";

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
    const parsedQuery = lookupQuerySchema.safeParse(ctx.req.query());

    if (!parsedQuery.success) {
        throw new HTTPException(400, {
            message: Option.from(parsedQuery.error.issues[0]?.message).unwrapOr(
                "Invalid domain query",
            ),
        });
    }

    const authUser = ctx.get("authUser");
    const result = (await performTraceroute(
        parsedQuery.data.domain,
        authUser.userId,
    )) satisfies TracerouteResponse;
    return ctx.json(result);
}
