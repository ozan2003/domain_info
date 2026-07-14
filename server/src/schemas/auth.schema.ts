/**
 * @file auth.schema.ts
 * @fileoverview Zod schemas for validating authentication payloads (register/login) at runtime.
 *
 * @author Ozan Malcı
 */
import * as z from "zod";
import { MIN_PASSWORD_LENGTH, SHORT_PASSWD_ERROR_MSG } from "../constants.js";

/**
 * Validation schema for user registration and login.
 */
export const registerSchema = z.object({
    email: z.email().trim().toLowerCase(),
    password: z.string().min(MIN_PASSWORD_LENGTH, SHORT_PASSWD_ERROR_MSG),
});

export const loginSchema = registerSchema;

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Represents an authenticated user extracted from a JWT.
 */
export interface AuthUser {
    userId: number;
    email: string;
}
