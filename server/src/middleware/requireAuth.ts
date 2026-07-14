/**
 * @file requireAuth.ts
 * @fileoverview Authentication middleware. Verifies the JWT cookie and attaches the
 * authenticated user to the Hono context for downstream handlers.
 *
 * @author Ozan Malcı
 */
import type { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import { verifyToken } from "../services/authService.js";
import type { AppEnv } from "../types/app.js";
import { AUTH_REQUIRED_ERROR_MSG } from "../constants.js";

/**
 * Middleware that requires a valid JWT cookie. Attaches `authUser` to context.
 * Throws 401 if the cookie is missing or the token is invalid.
 *
 * @param ctx The Hono context.
 * @param next The next middleware/handler in the chain.
 */
export async function requireAuth(
    ctx: Context<AppEnv>,
    next: Next,
): Promise<void> {
    const token = getCookie(ctx, "token");
    if (!token) {
        throw new HTTPException(401, { message: AUTH_REQUIRED_ERROR_MSG });
    }

    const authUser = await verifyToken(token);
    ctx.set("authUser", authUser);
    await next();
}
