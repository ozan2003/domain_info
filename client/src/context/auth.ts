/**
 * @file auth.ts
 * @fileoverview Auth context, types, and hook. Kept JSX-free so the file
 * satisfies the react-refresh `only-export-components` rule; the provider
 * component lives in `AuthProvider.tsx`.
 *
 * @author Ozan Malcı
 */
import { createContext, useContext } from "react";
import type { AuthUser } from "../types";
import type { Option, Result } from "oxide.ts";
import { AUTH_CONTEXT_ERROR_MSG } from "../constants";

/** Value exposed through the auth context. */
export interface AuthContextValue {
    /** True while the initial `/api/auth/me` hydration is in flight. */
    isLoading: boolean;
    /** Authenticated user, if any. `None` covers both "still loading" and "anonymous". */
    user: Option<AuthUser>;
    /** Logs the user in. Returns the result so the caller can display server errors. */
    login: (
        email: string,
        password: string,
    ) => Promise<Result<AuthUser, string>>;
    /** Registers a new user. Returns the result so the caller can display server errors. */
    register: (
        email: string,
        password: string,
    ) => Promise<Result<AuthUser, string>>;
    /** Logs the current user out, then clears local state. */
    logout: () => Promise<void>;
}

/** React context for the auth state and actions. */
export const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Hook for reading the current auth state and invoking auth actions.
 *
 * @returns The current auth context value.
 * @throws If used outside of an `AuthProvider`.
 */
export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (ctx === null) {
        throw new Error(AUTH_CONTEXT_ERROR_MSG);
    }
    return ctx;
}
