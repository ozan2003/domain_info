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
import { tracerouteHandler } from "./routes/traceroute.js";
import { whoisHandler } from "./routes/whois.js";
import { asnHandler } from "./routes/asn.js";
import { ptrHandler } from "./routes/ptr.js";
import { historyHandler } from "./routes/history.js";
import { statsHandler } from "./routes/stats.js";
import {
    registerHandler,
    loginHandler,
    logoutHandler,
    meHandler,
} from "./routes/auth.js";
import { requireAuth } from "./middleware/requireAuth.js";
import type { AppEnv } from "./types/app.js";

const app = new Hono<AppEnv>();

app.use("*", cors());

app.get("/health", (ctx) => ctx.json({ isOk: true }));

// Auth — public
app.post("/api/auth/register", registerHandler);
app.post("/api/auth/login", loginHandler);

// Auth — protected
app.post("/api/auth/logout", requireAuth, logoutHandler);
app.get("/api/auth/me", requireAuth, meHandler);

// API — protected
app.get("/api/lookup", requireAuth, lookupHandler); // Usage: /api/lookup?target=example.com
app.get("/api/traceroute", requireAuth, tracerouteHandler); // Usage: /api/traceroute?target=example.com
app.get("/api/whois", requireAuth, whoisHandler); // Usage: /api/whois?domain=example.com
app.get("/api/asn", requireAuth, asnHandler); // Usage: /api/asn?ip=1.1.1.1
app.get("/api/ptr", requireAuth, ptrHandler); // Usage: /api/ptr?ip=1.1.1.1
app.get("/api/history", requireAuth, historyHandler); // Usage: /api/history
app.get("/api/stats", requireAuth, statsHandler); // Usage: /api/stats

app.onError((error, ctx) => {
    if (error instanceof HTTPException) {
        return ctx.json({ error: error.message }, error.status);
    }

    console.error(error);
    return ctx.json({ error: "Internal Server Error" }, 500);
});

export { app };
