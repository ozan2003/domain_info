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

const validUser = {
    email: "whois-user@example.com",
    password: "password123",
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe("GET /api/whois (protected)", () => {
    it("returns normalized WHOIS data when authenticated", async () => {
        const registerRes = await app.request("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(validUser),
        });
        const token = getCookie(registerRes, "token")!;

        const res = await app.request("/api/whois?domain=example.com", {
            headers: authHeader(token),
        });

        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.domain).toBe("example.com");
        expect(body.registrar).toBe("Example Registrar, Inc.");
        expect(body.creationDate).toBe("2020-01-01T00:00:00Z");
        expect(body.expirationDate).toBe("2030-01-01T00:00:00Z");
        expect(body.nameServers).toEqual(["ns1.example.net", "ns2.example.net"]);
        expect(body.rawData).toContain("Domain Name: example.com");
        expect(body.isCached).toBe(false);
    });

    it("returns 401 without authentication", async () => {
        const res = await app.request("/api/whois?domain=example.com");

        expect(res.status).toBe(401);
        const body = await res.json();
        expect(body.error).toBe("authentication required");
    });
});
