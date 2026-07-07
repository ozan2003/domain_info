/**
 * @file app.ts
 * @fileoverview Hono application setup. Configures routes, middleware, and error handling.
 * Separated from index.ts to allow direct testing via `app.request()`.
 *
 * @author Ozan Malcı
 */
import "dotenv/config";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { lookupHandler } from "./routes/lookup.js";
import {
    registerHandler,
    loginHandler,
    logoutHandler,
    meHandler,
} from "./routes/auth.js";
import { requireAuth } from "./middleware/requireAuth.js";

const app = new Hono();

app.use("*", cors());

app.get("/health", (ctx) => ctx.json({ isOk: true }));

// Auth — public
app.post("/api/auth/register", registerHandler);
app.post("/api/auth/login", loginHandler);

// Auth — protected
app.post("/api/auth/logout", requireAuth, logoutHandler);
app.get("/api/auth/me", requireAuth, meHandler);

// API — protected
app.get("/api/lookup", requireAuth, lookupHandler);

// History
app.get("/api/history", requireAuth, () => {
    throw new Error("TODO");
});
// Statistics
app.get("/api/stats", requireAuth, () => {
    throw new Error("TODO");
});

app.onError((error, ctx) => {
    if (error instanceof HTTPException) {
        return ctx.json({ error: error.message }, error.status);
    }

    console.error(error);
    return ctx.json({ error: "Internal Server Error" }, 500);
});

export { app };
