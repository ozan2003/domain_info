/**
 * @file AuthProvider.tsx
 * @fileoverview React provider that hydrates the auth user from
 * `/api/auth/me` on mount and exposes login/register/logout actions via context.
 * The user is stored as `Option<AuthUser>`; loading is tracked by a separate
 * `isLoading` boolean.
 *
 * @author Ozan Malcı
 */
import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import { match, None, Some, type Option } from "oxide.ts";
import type { AuthUser } from "../types";
import {
    fetchMe,
    login as apiLogin,
    logout as apiLogout,
    register as apiRegister,
} from "../api";
import { AuthContext, type AuthContextValue } from "./auth";

interface AuthProviderProps {
    children: ReactNode;
}

/**
 * Provides auth state and actions to descendants. Hydrates from `/api/auth/me` on mount.
 *
 * @param param0 - The children to wrap.
 * @returns The provider component.
 */
export function AuthProvider({ children }: AuthProviderProps) {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [user, setUser] = useState<Option<AuthUser>>(None);

    useEffect(() => {
        void (async () => {
            try {
                const result = await fetchMe();
                match(result, {
                    Ok: (userOption) => {
                        setUser(userOption);
                    },
                    Err: () => {
                        setUser(None);
                    },
                });
            } finally {
                setIsLoading(false);
            }
        })();
    }, []);

    const login = useCallback<AuthContextValue["login"]>(
        async (email, password) => {
            const result = await apiLogin(email, password);
            match(result, {
                Ok: (authenticatedUser) => {
                    setUser(Some(authenticatedUser));
                },
                Err: () => {
                    /* state unchanged; caller surfaces the error */
                },
            });
            return result;
        },
        [],
    );

    const register = useCallback<AuthContextValue["register"]>(
        async (email, password) => {
            const result = await apiRegister(email, password);
            match(result, {
                Ok: (authenticatedUser) => {
                    setUser(Some(authenticatedUser));
                },
                Err: () => {
                    /* state unchanged; caller surfaces the error */
                },
            });
            return result;
        },
        [],
    );

    const logout = useCallback<AuthContextValue["logout"]>(async () => {
        const result = await apiLogout();
        if (result.isOk()) {
            setUser(None);
        }
    }, []);

    const value = useMemo<AuthContextValue>(
        () => ({ isLoading, user, login, register, logout }),
        [isLoading, user, login, register, logout],
    );

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}
