/**
 * @file LookupView.tsx
 * @fileoverview Authenticated dashboard with tabs (Lookup / History / Stats).
 * Delegates lookup state and execution to the `useLookup` hook.
 *
 * @author Ozan Malcı
 */
import { useState } from "react";
import { match } from "oxide.ts";
import { useLookup, type LookupResult } from "../hooks/useLookup";
import { LookupForm } from "./LookupForm";
import { ResultsPanel } from "./ResultsPanel";
import { TracerouteResult } from "./TracerouteResult";
import { WhoisResult } from "./WhoisResult";
import { AsnResult } from "./AsnResult";
import { PtrResult } from "./PtrResult";
import { HistoryPanel } from "./HistoryPanel";
import { StatsPanel } from "./StatsPanel";
import { Spinner } from "./Spinner";
import { ErrorMessage } from "./ErrorMessage";
import "./LookupView.css";

type Tab = "lookup" | "history" | "stats";

const TABS: Tab[] = ["lookup", "history", "stats"];

/**
 * Renders the authenticated dashboard with tabbed navigation.
 *
 * @returns The dashboard JSX.
 */
export function LookupView() {
    const [activeTab, setActiveTab] = useState<Tab>("lookup");
    const {
        lookupType,
        result,
        isLoading,
        error,
        handleTypeChange,
        handleLookup,
    } = useLookup();

    return (
        <div className="lookup-view">
            <nav className="app__tabs" aria-label="Dashboard">
                {TABS.map((tab) => (
                    <button
                        key={tab}
                        type="button"
                        aria-pressed={activeTab === tab}
                        className={`app__tab${activeTab === tab ? " app__tab--active" : ""}`}
                        onClick={() => {
                            setActiveTab(tab);
                        }}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </nav>

            {activeTab === "lookup" && (
                <>
                    <LookupForm
                        type={lookupType}
                        onTypeChange={handleTypeChange}
                        onSubmit={(value) => void handleLookup(value)}
                        isLoading={isLoading}
                    />
                    {isLoading && <Spinner />}
                    {match(error, {
                        Some: (msg) => <ErrorMessage message={msg} />,
                        None: () => null,
                    })}
                    {renderResult(result)}
                </>
            )}

            <HistoryPanel hidden={activeTab !== "history"} />
            <StatsPanel hidden={activeTab !== "stats"} />
        </div>
    );
}

function renderResult(result: ReturnType<typeof useLookup>["result"]) {
    return match(result, {
        Some: (r: LookupResult) => {
            switch (r.kind) {
                case "dns":
                    return <ResultsPanel data={r.data} />;
                case "traceroute":
                    return <TracerouteResult data={r.data} />;
                case "whois":
                    return <WhoisResult data={r.data} />;
                case "asn":
                    return <AsnResult data={r.data} />;
                case "ptr":
                    return <PtrResult data={r.data} />;
                default: {
                    const _exhaustiveCheck: never = r;
                    throw new Error(
                        `Unhandled lookup result kind: ${_exhaustiveCheck}`,
                    );
                }
            }
        },
        None: () => null,
    });
}
