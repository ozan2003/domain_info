/**
 * @file lookup.ts
 * @fileoverview Route handler for DNS lookup requests. Validates query parameters and invokes the lookup service.
 *
 * @author Ozan Malcı
 */
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import {
    lookupQuerySchema,
    type LookupResponse,
} from "../schemas/lookup.schema.js";
import { performLookup } from "../services/lookupService.js";

/**
 * Handles GET /api/lookup requests by validating the query and resolving DNS records.
 *
 * @param ctx The Hono context.
 * @returns A JSON response containing the DNS records.
 */
export async function lookupHandler(ctx: Context): Promise<Response> {
    const parsedQuery = lookupQuerySchema.safeParse(ctx.req.query());

    if (!parsedQuery.success) {
        throw new HTTPException(400, {
            message:
                parsedQuery.error.issues[0]?.message ?? "Invalid domain query",
        });
    }

    const authUser = ctx.get("authUser");
    const result = (await performLookup(
        parsedQuery.data.domain,
        authUser.userId,
    )) satisfies LookupResponse;
    return ctx.json(result);
}
