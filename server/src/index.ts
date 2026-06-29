import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { HTTPException } from "hono/http-exception";
import { lookupHandler } from "./routes/lookup.js";

const app = new Hono();
const PORT = Number(process.env.PORT) || 6633;

// Sanity check.
app.get("/health", (ctx) => ctx.json({ isOk: true }));
// Domain lookup happens here.
// Example: GET /api/lookup?domain=example.com
app.get("/api/lookup", lookupHandler);

app.onError((error, ctx) => {
    if (error instanceof HTTPException) {
        return ctx.json({ error: error.message }, error.status);
    }

    console.error(error);
    return ctx.json({ error: "Internal Server Error" }, 500);
});

serve({
    fetch: app.fetch,
    port: PORT,
});
