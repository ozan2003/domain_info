/**
 * @file asn.ts
 * @fileoverview Route handler for ASN lookup requests.
 *
 * @author Ozan Malcı
 */
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Option } from "oxide.ts";
import {
    asnQuerySchema,
    type AsnResponse,
} from "../schemas/asn.schema.js";
import { performAsnLookup } from "../services/asnCacheService.js";
import type { AppEnv } from "../types/app.js";

/**
 * Handles GET /api/asn requests by validating the query and performing an
 * ASN lookup scoped to the calling user.
 *
 * @param ctx The Hono context.
 * @returns A JSON response containing ASN data for the requested IP.
 */
export async function asnHandler(ctx: Context<AppEnv>): Promise<Response> {
    const parsedQuery = asnQuerySchema.safeParse(ctx.req.query());

    if (!parsedQuery.success) {
        throw new HTTPException(400, {
            message: Option.from(parsedQuery.error.issues[0]?.message).unwrapOr(
                "Invalid ip query",
            ),
        });
    }

    const authUser = ctx.get("authUser");
    const result = (await performAsnLookup(
        parsedQuery.data.ip,
        authUser.userId,
    )) satisfies AsnResponse;

    return ctx.json(result);
}