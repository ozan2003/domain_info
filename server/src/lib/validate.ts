/**
 * @file validate.ts
 * @fileoverview Request parsing helpers. Centralizes Zod-based validation
 * for query strings and JSON bodies so route handlers don't repeat the
 * safeParse + HTTPException routine.
 *
 * @author Ozan Malcı
 */
import type { Context, Env } from "hono";
import { HTTPException } from "hono/http-exception";
import { Option } from "oxide.ts";
import type { z } from "zod";

/**
 * Parses and validates the request query string against a Zod schema.
 *
 * Throws an HTTP 400 with the first Zod issue message on failure.
 *
 * @typeParam E - The Hono environment type.
 * @typeParam S - The Zod schema type.
 * @param ctx The Hono context.
 * @param schema The Zod schema to validate the query against.
 * @returns The validated, strongly-typed query data.
 */
export function parseQuery<E extends Env, S extends z.ZodType>(
    ctx: Context<E>,
    schema: S,
): z.infer<S> {
    const result = schema.safeParse(ctx.req.query());
    if (!result.success) {
        const message = Option.from(result.error.issues[0]?.message).unwrapOr(
            "Invalid query",
        );
        throw new HTTPException(400, { message });
    }
    return result.data;
}

/**
 * Parses and validates the request JSON body against a Zod schema.
 *
 * Throws an HTTP 400 if the body is not valid JSON or fails validation.
 *
 * @typeParam E - The Hono environment type.
 * @typeParam S - The Zod schema type.
 * @param ctx The Hono context.
 * @param schema The Zod schema to validate the body against.
 * @returns The validated, strongly-typed body data.
 */
export async function parseJson<E extends Env, S extends z.ZodType>(
    ctx: Context<E>,
    schema: S,
): Promise<z.infer<S>> {
    let body: unknown;
    try {
        body = await ctx.req.json();
    } catch {
        throw new HTTPException(400, { message: "Invalid JSON body" });
    }
    const result = schema.safeParse(body);
    if (!result.success) {
        const message = Option.from(result.error.issues[0]?.message).unwrapOr(
            "Invalid input",
        );
        throw new HTTPException(400, { message });
    }
    return result.data;
}
