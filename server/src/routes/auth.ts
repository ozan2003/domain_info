/**
 * @file auth.ts
 * @fileoverview Route handlers for authentication (register, login, logout, me).
 *
 * @author Ozan Malcı
 */
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { setCookie, deleteCookie } from "hono/cookie";
import { registerSchema, loginSchema } from "../schemas/auth.schema.js";
import { registerUser, loginUser, signToken } from "../services/authService.js";

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
};

/**
 * Sets the JWT auth cookie on the response.
 *
 * @param ctx The Hono context.
 * @param token The JWT string.
 */
function setAuthCookie(ctx: Context, token: string): void {
    setCookie(ctx, "token", token, COOKIE_OPTIONS);
}

/**
 * Clears the JWT auth cookie from the response.
 *
 * @param ctx The Hono context.
 */
function clearAuthCookie(ctx: Context): void {
    deleteCookie(ctx, "token", COOKIE_OPTIONS);
}

/**
 * Handles user registration. Creates a new user and sets the JWT cookie.
 *
 * @param ctx The Hono context.
 * @returns JSON response with the new user.
 */
export async function registerHandler(ctx: Context): Promise<Response> {
    const body: unknown = await ctx.req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
        throw new HTTPException(400, {
            message: parsed.error.issues[0]?.message ?? "invalid input",
        });
    }

    const { email, password } = parsed.data;
    const user = await registerUser(email, password);
    const token = await signToken(user.userId, user.email);
    setAuthCookie(ctx, token);
    return ctx.json(user, 201);
}

/**
 * Handles user login. Verifies credentials and sets the JWT cookie.
 *
 * @param ctx The Hono context.
 * @returns JSON response with the authenticated user.
 */
export async function loginHandler(ctx: Context): Promise<Response> {
    const body: unknown = await ctx.req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
        throw new HTTPException(400, {
            message: parsed.error.issues[0]?.message ?? "invalid input",
        });
    }

    const { email, password } = parsed.data;
    const user = await loginUser(email, password);
    const token = await signToken(user.userId, user.email);
    setAuthCookie(ctx, token);
    return ctx.json(user);
}

/**
 * Handles user logout. Clears the JWT cookie.
 *
 * @param ctx The Hono context.
 * @returns JSON response confirming logout.
 */
export function logoutHandler(ctx: Context): Response {
    clearAuthCookie(ctx);
    return ctx.json({ message: "logged out" });
}

/**
 * Returns the currently authenticated user from the JWT cookie.
 *
 * @param ctx The Hono context.
 * @returns JSON response with the current user.
 */
export function meHandler(ctx: Context): Response {
    const authUser = ctx.get("authUser");
    return ctx.json(authUser);
}
