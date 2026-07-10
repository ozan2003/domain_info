/**
 * @file LookupView.tsx
 * @fileoverview Owns the DNS lookup state (result, loading, error) and renders
 * the lookup form plus its results. Kept as a separate component so that signing
 * out unmounts it and the result state is discarded, instead of leaking back in
 * on the next sign-in.
 *
 * @author Ozan Malcı
 */
import { useState } from "react";
import { type Option, Some, None, match } from "oxide.ts";
import { lookupDomain } from "../api";
import type { LookupResponse } from "../types";
import { LookupForm } from "./LookupForm";
import { Spinner } from "./Spinner";
import { ErrorMessage } from "./ErrorMessage";
import { ResultsPanel } from "./ResultsPanel";

/**
 * Renders the lookup workflow. Owns the result, loading, and error state.
 *
 * @returns The lookup view JSX.
 */
export function LookupView() {
    const [result, setResult] = useState<Option<LookupResponse>>(None);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<Option<string>>(None);

    async function handleLookup(domain: string) {
        setIsLoading(true);
        setResult(None);
        setError(None);

        try {
            match(await lookupDomain(domain), {
                Ok: (data) => {
                    setResult(Some(data));
                },
                Err: (msg) => {
                    setError(Some(msg));
                },
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <>
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
        </>
    );
}
