/**
 * @file history-stats.test.ts
 * @fileoverview Integration tests for /api/history and /api/stats endpoints.
 * Verifies per-user isolation, the flat-timeline shape, and the cache hit
 * ratio math.
 *
 * @author Ozan Malcı
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("whois", () => ({
    lookup: vi.fn((domain: string, callback: (error: Error | null, data: string) => void) => {
        callback(
            null,
            [
                `Domain Name: ${domain}`,
                "Registrar: Example Registrar, Inc.",
                "Creation Date: 2020-01-01T00:00:00Z",
                "Registry Expiry Date: 2030-01-01T00:00:00Z",
                "Name Server: ns1.example.net",
                "Name Server: ns2.example.net",
            ].join("\n"),
        );
    }),
}));

vi.mock("nodejs-traceroute", () => ({
    default: {
        trace: (_host: string) => {
            const { EventEmitter } = require("node:events") as typeof import("node:events");
            const emitter = new EventEmitter();
            setImmediate(() => {
                emitter.emit("destination", "203.0.113.1");
                emitter.emit("hop", { hop: 1, ip: "10.0.0.1", rtt: "1 ms" });
                emitter.emit("hop", { hop: 2, ip: "10.0.0.2", rtt: "5 ms" });
                emitter.emit("close", 0);
            });
            return emitter;
        },
    },
}));

import { app } from "../src/app.js";

function getCookie(response: Response, name: string): string | null {
    const header = response.headers.get("set-cookie");
    if (!header) return null;
    const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
    return match?.[1] ?? null;
}

function authHeader(token: string): HeadersInit {
    return { Cookie: `token=${token}` };
}

async function register(email: string, password: string): Promise<string> {
    const res = await app.request("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    return getCookie(res, "token")!;
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe("GET /api/history (protected)", () => {
    it("returns 401 without authentication", async () => {
        const res = await app.request("/api/history?page=1&pageSize=10");
        expect(res.status).toBe(401);
    });

    it("returns only the calling user's history, paginated", async () => {
        const tokenA = await register("hist-a@example.com", "password123");
        const tokenB = await register("hist-b@example.com", "password123");

        // User A: 1 DNS lookup + 1 WHOIS lookup.
        await app.request("/api/lookup?domain=localhost", {
            headers: authHeader(tokenA),
        });
        await app.request("/api/whois?domain=example.com", {
            headers: authHeader(tokenA),
        });

        // User B: 1 DNS lookup.
        await app.request("/api/lookup?domain=localhost", {
            headers: authHeader(tokenB),
        });

        const resA = await app.request("/api/history?page=1&pageSize=25", {
            headers: authHeader(tokenA),
        });
        expect(resA.status).toBe(200);
        const bodyA = (await resA.json()) as {
            items: Array<{ kind: string }>;
            page: number;
            pageSize: number;
            hasMore: boolean;
        };
        expect(bodyA.page).toBe(1);
        expect(bodyA.pageSize).toBe(25);
        expect(bodyA.hasMore).toBe(false);
        // User A: 1 dns + 1 whois = 2 items, all belong to A.
        expect(bodyA.items.length).toBe(2);
        const kindsA = bodyA.items.map((i) => i.kind).sort();
        expect(kindsA).toEqual(["dns", "whois"]);

        // User B: only sees their 1 row.
        const resB = await app.request("/api/history?page=1&pageSize=25", {
            headers: authHeader(tokenB),
        });
        const bodyB = (await resB.json()) as {
            items: Array<{ kind: string }>;
        };
        expect(bodyB.items.length).toBe(1);
        expect(bodyB.items[0]?.kind).toBe("dns");
    }, 30_000);
});

describe("GET /api/stats (protected)", () => {
    it("returns 401 without authentication", async () => {
        const res = await app.request("/api/stats");
        expect(res.status).toBe(401);
    });

    it("returns zeroed stats for a user with no lookups", async () => {
        const token = await register("empty@example.com", "password123");
        const res = await app.request("/api/stats", {
            headers: authHeader(token),
        });
        expect(res.status).toBe(200);
        const body = (await res.json()) as {
            totals: { dns: number; traceroute: number; whois: number; asn: number };
            cacheHitRatio: { dns: { total: number; cached: number; ratio: number } };
        };
        expect(body.totals).toEqual({ dns: 0, traceroute: 0, whois: 0, asn: 0 });
        expect(body.cacheHitRatio.dns).toEqual({ total: 0, cached: 0, ratio: 0 });
    });

    it("isolates stats per user and computes a non-zero DNS cache hit ratio", async () => {
        const tokenA = await register("stats-a@example.com", "password123");
        const tokenB = await register("stats-b@example.com", "password123");

        // User A: 1 fresh DNS + 1 cached DNS hit (same domain twice) + 1 WHOIS.
        await app.request("/api/lookup?domain=localhost", {
            headers: authHeader(tokenA),
        });
        await app.request("/api/lookup?domain=localhost", {
            headers: authHeader(tokenA),
        });
        await app.request("/api/whois?domain=example.com", {
            headers: authHeader(tokenA),
        });

        // User B: 1 DNS.
        await app.request("/api/lookup?domain=localhost", {
            headers: authHeader(tokenB),
        });

        const resA = await app.request("/api/stats", {
            headers: authHeader(tokenA),
        });
        const bodyA = (await resA.json()) as {
            totals: { dns: number; whois: number };
            cacheHitRatio: { dns: { total: number; cached: number; ratio: number } };
            topDomains: { dns: Array<{ domain: string; count: number }> };
        };

        expect(bodyA.totals.dns).toBe(2);
        expect(bodyA.totals.whois).toBe(1);
        expect(bodyA.cacheHitRatio.dns.total).toBe(2);
        expect(bodyA.cacheHitRatio.dns.cached).toBe(1);
        expect(bodyA.cacheHitRatio.dns.ratio).toBe(0.5);
        expect(bodyA.topDomains.dns[0]?.domain).toBe("localhost");
        expect(bodyA.topDomains.dns[0]?.count).toBe(2);

        const resB = await app.request("/api/stats", {
            headers: authHeader(tokenB),
        });
        const bodyB = (await resB.json()) as {
            totals: { dns: number; whois: number };
        };
        expect(bodyB.totals.dns).toBe(1);
        expect(bodyB.totals.whois).toBe(0);
    }, 30_000);
});
