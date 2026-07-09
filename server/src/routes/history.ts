/**
 * @file history.ts
 * @fileoverview Placeholder route for lookup history. Returns 501 until
 * historyService.ts is implemented.
 *
 * @author Ozan Malcı
 */
import { HTTPException } from "hono/http-exception";
import type { Context } from "hono";
import type { AppEnv } from "../types/app.js";

/**
 * Handles GET /api/history requests. Not yet implemented.
 *
 * @param _ctx The Hono context.
 * @returns Never resolves normally; always throws 501.
 */
export function historyHandler(_ctx: Context<AppEnv>): never {
    throw new HTTPException(501, { message: "Not implemented" });
}
