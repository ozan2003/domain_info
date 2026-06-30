/**
 * @file index.ts
 * @fileoverview Entry point for the DNS lookup server. Sets up routes, middleware, and error handling.
 *
 * @author Ozan Malcı
 */
import "dotenv/config";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { lookupHandler } from "./routes/lookup.js";

const app = new Hono();
const PORT = Number(process.env.PORT) || 6633;

app.use("*", cors());

// Sanity check.
app.get("/health", (ctx) => ctx.json({ isOk: true }));
// Domain lookup happens here.
// Example: GET /api/lookup?domain=example.com
app.get("/api/lookup", lookupHandler);
// History.
app.get("/api/history", () => {
    throw new Error("TODO");
});
// Statistics
app.get("/api/stats", () => {
    throw new Error("TODO");
});

app.onError((error, ctx) => {
    if (error instanceof HTTPException) {
        return ctx.json({ error: error.message }, error.status);
    }

    console.error(error);
    return ctx.json({ error: "Internal Server Error" }, 500);
});

serve(
    {
        fetch: app.fetch,
        port: PORT,
    },
    (info) => {
        console.log(`Server listening on http://localhost:${info.port}`);
    },
);
