/**
 * @file authService.ts
 * @fileoverview Authentication service. Handles password hashing, JWT signing/verification,
 * and user registration/login logic.
 *
 * @author Ozan Malcı
 */
import { hash, verify as verifyPassword } from "argon2";
import { sign, verify } from "hono/jwt";
import { prisma } from "../db.js";
import { HTTPException } from "hono/http-exception";
import type { AuthUser } from "../schemas/auth.schema.js";
import {
    JWT_SECRET_MISSING_ERROR_MSG,
    JWT_SECRET_PLACEHOLDER_ERROR_MSG,
    JWT_SECRET_TOO_SHORT_ERROR_MSG,
    MIN_JWT_SECRET_LENGTH,
    INVALID_TOKEN_ERROR_MSG,
    INVALID_TOKEN_PAYLOAD_ERROR_MSG,
    EMAIL_TAKEN_ERROR_MSG,
    INVALID_CREDENTIALS_ERROR_MSG,
} from "../constants.js";

const JWT_SECRET = process.env.JWT_SECRET ?? "";
const JWT_EXPIRY_SECONDS = 60 * 60 * 24 * 7; // 7 days

if (!JWT_SECRET) {
    throw new Error(JWT_SECRET_MISSING_ERROR_MSG);
}
if (JWT_SECRET.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(JWT_SECRET_TOO_SHORT_ERROR_MSG(JWT_SECRET.length));
}
if (JWT_SECRET.toLowerCase().includes("change-me")) {
    throw new Error(JWT_SECRET_PLACEHOLDER_ERROR_MSG);
}

/**
 * Hashes a password using argon2.
 *
 * @param password The plaintext password to hash.
 * @returns The argon2 hash string.
 */
export async function hashPassword(password: string): Promise<string> {
    return hash(password);
}

/**
 * Verifies a plaintext password against an argon2 hash.
 *
 * @param storedHash The stored argon2 hash.
 * @param password The plaintext password to verify.
 * @returns Whether the password matches the hash.
 */
export async function checkPassword(
    storedHash: string,
    password: string,
): Promise<boolean> {
    return verifyPassword(storedHash, password);
}

/**
 * Signs a JWT for the given user.
 *
 * @param userId The user's database ID.
 * @param email The user's email.
 * @returns The signed JWT string.
 */
export async function signToken(
    userId: number,
    email: string,
): Promise<string> {
    const now = Math.floor(Date.now() / 1000); // Unix timestamp in seconds
    return sign(
        {
            userId,
            email,
            iat: now,
            exp: now + JWT_EXPIRY_SECONDS,
        },
        JWT_SECRET,
        "HS256",
    );
}

/**
 * Verifies a JWT and extracts the auth user payload.
 *
 * @param token The JWT string to verify.
 * @returns The decoded auth user.
 */
export async function verifyToken(token: string): Promise<AuthUser> {
    let payload;
    try {
        payload = await verify(token, JWT_SECRET, "HS256");
    } catch {
        throw new HTTPException(401, { message: INVALID_TOKEN_ERROR_MSG });
    }

    const userId = payload.userId as number | undefined;
    const email = payload.email as string | undefined;
    if (!userId || !email) {
        throw new HTTPException(401, {
            message: INVALID_TOKEN_PAYLOAD_ERROR_MSG,
        });
    }
    return { userId, email };
}

/**
 * Registers a new user with the given email and password.
 *
 * @param email The user's email address.
 * @param password The user's plaintext password.
 * @returns The newly created auth user.
 */
export async function registerUser(
    email: string,
    password: string,
): Promise<AuthUser> {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        throw new HTTPException(409, { message: EMAIL_TAKEN_ERROR_MSG });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
        data: { email, passwordHash },
    });

    return { userId: user.id, email: user.email } satisfies AuthUser;
}

/**
 * Authenticates a user with email and password.
 *
 * @param email The user's email address.
 * @param password The user's plaintext password.
 * @returns The authenticated auth user.
 */
export async function loginUser(
    email: string,
    password: string,
): Promise<AuthUser> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        throw new HTTPException(401, {
            message: INVALID_CREDENTIALS_ERROR_MSG,
        });
    }

    const valid = await checkPassword(user.passwordHash, password);
    if (!valid) {
        throw new HTTPException(401, {
            message: INVALID_CREDENTIALS_ERROR_MSG,
        });
    }

    return { userId: user.id, email: user.email } satisfies AuthUser;
}
