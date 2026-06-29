import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import {
    lookupQuerySchema,
    type LookupResponse,
} from "../schemas/lookup.schema.js";
import { lookupDomain } from "../services/dnsService.js";

export async function lookupHandler(ctx: Context) {
    const parsedQuery = lookupQuerySchema.safeParse(ctx.req.query());

    if (!parsedQuery.success) {
        throw new HTTPException(400, {
            message:
                parsedQuery.error.issues[0]?.message ?? "Invalid domain query",
        });
    }

    const result = (await lookupDomain(
        parsedQuery.data.domain,
    )) satisfies LookupResponse;
    return ctx.json(result);
}
