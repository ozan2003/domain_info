/**
 * @file whois.ts
 * @fileoverview Route handler for WHOIS requests.
 *
 * @author Ozan Malcı
 */
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Option } from "oxide.ts";
import {
    whoisQuerySchema,
    type WhoisResponse,
} from "../schemas/whois.schema.js";
import { performWhoisLookup } from "../services/whoisCacheService.js";
import type { AppEnv } from "../types/app.js";

/**
 * Handles GET /api/whois requests.
 *
 * @param ctx The Hono context.
 * @returns A JSON response containing WHOIS data.
 */
export async function whoisHandler(ctx: Context<AppEnv>): Promise<Response> {
    const parsedQuery = whoisQuerySchema.safeParse(ctx.req.query());

    if (!parsedQuery.success) {
        throw new HTTPException(400, {
            message: Option.from(parsedQuery.error.issues[0]?.message).unwrapOr(
                "Invalid domain query",
            ),
        });
    }

    const authUser = ctx.get("authUser");
    const result = (await performWhoisLookup(
        parsedQuery.data.domain,
        authUser.userId,
    )) satisfies WhoisResponse;

    return ctx.json(result);
}
