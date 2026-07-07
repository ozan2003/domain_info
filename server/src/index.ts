/**
 * @file index.ts
 * @fileoverview Entry point. Starts the HTTP server using the Hono app from app.ts.
 *
 * @author Ozan Malcı
 */
import { serve } from "@hono/node-server";
import { app } from "./app.js";

const PORT = Number(process.env.PORT) || 6633;

serve(
    {
        fetch: app.fetch,
        port: PORT,
    },
    (info) => {
        console.log(`Server listening on http://localhost:${info.port}`);
    },
);
