/**
 * @file App.tsx
 * @fileoverview Root application component. Renders the auth gate
 * (loading spinner, sign-in/register card, or authenticated view).
 *
 * @author Ozan Malcı
 */
import { match } from "oxide.ts";
import { AuthPanel } from "./components/AuthPanel";
import { LookupView } from "./components/LookupView";
import { Spinner } from "./components/Spinner";
import { useAuth } from "./context/auth";
import "./App.css";

/** Root application component that orchestrates the auth gate. */
export default function App() {
    const { isLoading, user, logout } = useAuth();

    return (
        <div className="app">
            <header className="app__header">
                <div className="app__header-text">
                    <h1 className="app__title">Domain Info</h1>
                    <p className="app__subtitle">
                        Look up DNS records and inspect domain configuration.
                    </p>
                </div>
                {match(user, {
                    Some: (authenticatedUser) => (
                        <div className="app__user">
                            <span className="app__user-email">
                                {authenticatedUser.email}
                            </span>
                            <button
                                type="button"
                                className="app__user-button"
                                onClick={() => {
                                    void logout();
                                }}
                            >
                                Sign out
                            </button>
                        </div>
                    ),
                    None: () => null,
                })}
            </header>

            {isLoading && <Spinner />}
            {!isLoading &&
                match(user, {
                    None: () => <AuthPanel />,
                    Some: () => <LookupView />,
                })}
        </div>
    );
}
