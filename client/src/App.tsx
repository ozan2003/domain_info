/**
 * @file App.tsx
 * @fileoverview Root application component. Orchestrates the lookup form, loading state, and results display.
 *
 * @author Ozan Malcı
 */
import { useState } from "react";
import { lookupDomain } from "./api";
import type { LookupResponse } from "./types";
import { type Option, Some, None, match } from "oxide.ts";
import { LookupForm } from "./components/LookupForm";
import { Spinner } from "./components/Spinner";
import { ErrorMessage } from "./components/ErrorMessage";
import { ResultsPanel } from "./components/ResultsPanel";
import "./App.css";

/** Root application component that orchestrates the domain lookup workflow. */
export default function App() {
    const [result, setResult] = useState<Option<LookupResponse>>(None);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<Option<string>>(None);

    async function handleLookup(domain: string) {
        setIsLoading(true);
        setResult(None);
        setError(None);

        match(await lookupDomain(domain), {
            Ok: (data) => {
                setResult(Some(data));
            },
            Err: (msg) => {
                setError(Some(msg));
            },
        });

        setIsLoading(false);
    }

    return (
        <div className="app">
            <header className="app__header">
                <h1 className="app__title">Domain Info</h1>
                <p className="app__subtitle">
                    Look up DNS records and inspect domain configuration.
                </p>
            </header>

            <LookupForm
                onSubmit={(domain) => void handleLookup(domain)}
                isLoading={isLoading}
            />

            {isLoading && <Spinner />}
            {match(error, {
                Some: (msg) => <ErrorMessage message={msg} />,
                None: () => null,
            })}
            {match(result, {
                Some: (data) => <ResultsPanel data={data} />,
                None: () => null,
            })}
        </div>
    );
}
