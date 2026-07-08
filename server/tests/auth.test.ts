import { describe, it, expect } from "vitest";
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
    email: "user@example.com",
    password: "password123",
};

const anotherUser = {
    email: "other@example.com",
    password: "password456",
};

// ────────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register
// ────────────────────────────────────────────────────────────────────────────────
describe("POST /api/auth/register", () => {
    it("creates a user and returns 201 with auth cookie", async () => {
        const res = await app.request("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(validUser),
        });

        expect(res.status).toBe(201);

        const body = await res.json();
        expect(body).toHaveProperty("userId");
        expect(body).toHaveProperty("email", validUser.email);

        const token = getCookie(res, "token");
        expect(token).toBeTruthy();
        expect(token!.split(".")).toHaveLength(3); // valid JWT
    });

    it("returns 409 when email is already registered", async () => {
        // First registration.
        await app.request("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(validUser),
        });

        // Duplicate.
        const res = await app.request("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(validUser),
        });

        expect(res.status).toBe(409);
        const body = await res.json();
        expect(body.error).toBe("email already registered");
    });

    it("returns 400 for invalid email", async () => {
        const res = await app.request("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: "not-an-email",
                password: "password123",
            }),
        });

        expect(res.status).toBe(400);
    });

    it("returns 400 for password shorter than 8 characters", async () => {
        const res = await app.request("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: "user@example.com",
                password: "short",
            }),
        });

        expect(res.status).toBe(400);
    });
});

// ────────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ────────────────────────────────────────────────────────────────────────────────
describe("POST /api/auth/login", () => {
    it("logs in and returns 200 with auth cookie", async () => {
        // Register first.
        await app.request("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(validUser),
        });

        const res = await app.request("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(validUser),
        });

        expect(res.status).toBe(200);

        const body = await res.json();
        expect(body).toHaveProperty("userId");
        expect(body).toHaveProperty("email", validUser.email);

        const token = getCookie(res, "token");
        expect(token).toBeTruthy();
    });

    it("returns 401 for wrong password", async () => {
        // Register first.
        await app.request("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(validUser),
        });

        const res = await app.request("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...validUser, password: "wrongpassword" }),
        });

        expect(res.status).toBe(401);
        const body = await res.json();
        expect(body.error).toBe("invalid email or password");
    });

    it("returns 401 for non-existent email", async () => {
        const res = await app.request("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(validUser),
        });

        expect(res.status).toBe(401);
        const body = await res.json();
        expect(body.error).toBe("invalid email or password");
    });

    it("returns 400 for missing fields", async () => {
        const res = await app.request("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "user@example.com" }),
        });

        expect(res.status).toBe(400);
    });
});

// ────────────────────────────────────────────────────────────────────────────────
// GET /api/auth/me
// ────────────────────────────────────────────────────────────────────────────────

describe("GET /api/auth/me", () => {
    it("returns the current user when authenticated", async () => {
        const registerRes = await app.request("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(validUser),
        });
        const token = getCookie(registerRes, "token")!;

        const res = await app.request("/api/auth/me", {
            headers: authHeader(token),
        });

        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.userId).toBeTypeOf("number");
        expect(body.email).toBe(validUser.email);
    });

    it("returns 401 without cookie", async () => {
        const res = await app.request("/api/auth/me");

        expect(res.status).toBe(401);
        const body = await res.json();
        expect(body.error).toBe("authentication required");
    });

    it("returns 401 with tampered token", async () => {
        const res = await app.request("/api/auth/me", {
            headers: { Cookie: "token=not.a.valid.jwt" },
        });

        expect(res.status).toBe(401);
    });
});

// ────────────────────────────────────────────────────────────────────────────────
// POST /api/auth/logout
// ────────────────────────────────────────────────────────────────────────────────
describe("POST /api/auth/logout", () => {
    it("clears the auth cookie and returns logged out message", async () => {
        const registerRes = await app.request("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(validUser),
        });
        const token = getCookie(registerRes, "token")!;

        const res = await app.request("/api/auth/logout", {
            method: "POST",
            headers: authHeader(token),
        });

        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.message).toBe("logged out");
    });
});

// ────────────────────────────────────────────────────────────────────────────────
// GET /api/lookup (protected)
// ────────────────────────────────────────────────────────────────────────────────
describe("GET /api/lookup (protected)", () => {
    it("returns DNS records when authenticated", async () => {
        const registerRes = await app.request("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(validUser),
        });
        const token = getCookie(registerRes, "token")!;

        const res = await app.request("/api/lookup?domain=localhost", {
            headers: authHeader(token),
        });

        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.domain).toBe("localhost");
        expect(Array.isArray(body.a)).toBe(true);
        expect(Array.isArray(body.aaaa)).toBe(true);
    }, 15_000); // 15s

    it("returns 401 without authentication", async () => {
        const res = await app.request("/api/lookup?domain=localhost");

        expect(res.status).toBe(401);
        const body = await res.json();
        expect(body.error).toBe("authentication required");
    });
});

// ────────────────────────────────────────────────────────────────────────────────
// Auth flow: register -> login -> second user isolation
// ────────────────────────────────────────────────────────────────────────────────
describe("Auth user isolation", () => {
    it("login returns the correct user, not someone else", async () => {
        await app.request("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(validUser),
        });
        await app.request("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(anotherUser),
        });

        const res = await app.request("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(validUser),
        });

        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.email).toBe(validUser.email);
        expect(body.email).not.toBe(anotherUser.email);
    });
});
