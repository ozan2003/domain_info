/**
 * @file app.ts
 * @fileoverview Shared Hono environment type. Defines context variables available
 * to route handlers and middleware.
 *
 * @author Ozan Malcı
 */
import type { AuthUser } from "../schemas/auth.schema.js";

/**
 * Hono environment type for the application.
 *
 * Provides type-safe access to context variables via `ctx.get()` / `ctx.set()`.
 */
export interface AppEnv {
    Variables: {
        authUser: AuthUser;
    };
}
