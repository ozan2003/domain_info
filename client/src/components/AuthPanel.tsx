/**
 * @file AuthPanel.tsx
 * @fileoverview Centered card with a "Sign in" / "Create account" tab toggle
 * and the email/password form. Shown when no user is authenticated.
 *
 * @author Ozan Malcı
 */
import { useState, type SyntheticEvent } from "react";
import { useAuth } from "../context/auth";
import { ErrorMessage } from "./ErrorMessage";
import { match } from "oxide.ts";
import { MIN_PASSWORD_LENGTH, SHORT_PASSWD_ERROR_MSG } from "../constants";
import "./AuthPanel.css";

type Mode = "login" | "register";

/**
 * Renders the auth card with a tab toggle and the email/password form.
 *
 * @returns The auth panel JSX.
 */
export function AuthPanel() {
    const { login, register } = useAuth();
    const [mode, setMode] = useState<Mode>("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    function switchMode(next: Mode) {
        if (next === mode) {
            return;
        }
        setMode(next);
        setError(null);
    }

    async function handleSubmit(evt: SyntheticEvent<HTMLFormElement>) {
        evt.preventDefault();
        if (isSubmitting) {
            return;
        }
        setError(null);

        if (password.length < MIN_PASSWORD_LENGTH) {
            setError(SHORT_PASSWD_ERROR_MSG);
            return;
        }

        setIsSubmitting(true);
        try {
            const action = mode === "login" ? login : register;
            const result = await action(email, password);
            match(result, {
                Ok: () => {
                    // context state flips, parent re-renders away from this panel
                },
                Err: (msg) => {
                    setError(msg);
                },
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    const submitLabel = mode === "login" ? "Sign in" : "Create account";

    return (
        <div className="auth-panel">
            <div className="auth-panel__card">
                <div className="app__tabs auth-panel__tabs">
                    <button
                        type="button"
                        aria-pressed={mode === "login"}
                        className={`app__tab ${mode === "login" ? "app__tab--active" : ""}`}
                        onClick={() => {
                            switchMode("login");
                        }}
                    >
                        Sign in
                    </button>
                    <button
                        type="button"
                        aria-pressed={mode === "register"}
                        className={`app__tab ${mode === "register" ? "app__tab--active" : ""}`}
                        onClick={() => {
                            switchMode("register");
                        }}
                    >
                        Create account
                    </button>
                </div>

                <form
                    className="auth-panel__form"
                    onSubmit={(evt) => void handleSubmit(evt)}
                >
                    <label className="auth-panel__field">
                        <span className="auth-panel__field-label">Email</span>
                        <input
                            type="email"
                            className="lookup-form__input"
                            value={email}
                            onChange={(evt) => {
                                setEmail(evt.target.value);
                            }}
                            autoComplete="email"
                            required
                            disabled={isSubmitting}
                        />
                    </label>

                    <label className="auth-panel__field">
                        <span className="auth-panel__field-label">
                            Password
                        </span>
                        <input
                            type="password"
                            className="lookup-form__input"
                            value={password}
                            onChange={(evt) => {
                                setPassword(evt.target.value);
                            }}
                            autoComplete={
                                mode === "login"
                                    ? "current-password"
                                    : "new-password"
                            }
                            minLength={MIN_PASSWORD_LENGTH}
                            required
                            disabled={isSubmitting}
                        />
                    </label>

                    <button
                        type="submit"
                        className="lookup-form__button auth-panel__submit"
                        disabled={isSubmitting || !email.trim() || !password}
                    >
                        {submitLabel}
                    </button>
                </form>

                {error !== null && <ErrorMessage message={error} />}
            </div>
        </div>
    );
}
