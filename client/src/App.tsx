/**
 * @file App.tsx
 * @fileoverview Root application component. Orchestrates the lookup form, loading state, and results display.
 *
 * @author Ozan Malcı
 */
import { useState } from "react";
import { lookupDomain } from "./api";
import type { LookupResponse } from "./types";
import { LookupForm } from "./components/LookupForm";
import { Spinner } from "./components/Spinner";
import { ErrorMessage } from "./components/ErrorMessage";
import { ResultsPanel } from "./components/ResultsPanel";
import "./App.css";

/** Root application component that orchestrates the domain lookup workflow. */
export default function App() {
    const [result, setResult] = useState<LookupResponse | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    async function handleLookup(domain: string) {
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const data = await lookupDomain(domain);
            setResult(data);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "An unexpected error occurred",
            );
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="app">
            <header className="app__header">
                <h1 className="app__title">Domain Info</h1>
                <p className="app__subtitle">
                    Look up DNS records and inspect domain configuration.
                </p>
            </header>

            <LookupForm onSubmit={(domain) => void handleLookup(domain)} isLoading={isLoading} />

            {isLoading && <Spinner />}
            {error && <ErrorMessage message={error} />}
            {result && <ResultsPanel data={result} />}
        </div>
    );
}
