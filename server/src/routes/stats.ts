/**
 * @file stats.ts
 * @fileoverview Placeholder route for lookup statistics. Returns 501 until
 * statsService.ts is implemented.
 *
 * @author Ozan Malcı
 */
import { HTTPException } from "hono/http-exception";
import type { Context } from "hono";
import type { AppEnv } from "../types/app.js";

/**
 * Handles GET /api/stats requests. Not yet implemented.
 *
 * @param _ctx The Hono context.
 * @returns Never resolves normally; always throws 501.
 */
export function statsHandler(_ctx: Context<AppEnv>): never {
    throw new HTTPException(501, { message: "Not implemented" });
}
