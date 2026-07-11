/**
 * @file LookupView.tsx
 * @fileoverview Authenticated dashboard with tabs (Lookup / History / Stats).
 * Owns the lookup state (type, result, loading, error) and renders result
 * components for all five lookup types inline. Unmounts on sign-out so state
 * is discarded.
 *
 * @author Ozan Malcı
 */
import { useState } from "react";
import { type Option, Some, None, match } from "oxide.ts";
import {
    lookupDomain,
    lookupTraceroute,
    lookupWhois,
    lookupAsn,
    lookupPtr,
} from "../api";
import type {
    AsnResponse,
    LookupResponse,
    LookupType,
    PtrResponse,
    TracerouteResponse,
    WhoisResponse,
} from "../types";
import { LookupForm } from "./LookupForm";
import { ResultsPanel } from "./ResultsPanel";
import { TracerouteResult } from "./TracerouteResult";
import { WhoisResult } from "./WhoisResult";
import { AsnResult } from "./AsnResult";
import { HistoryPanel } from "./HistoryPanel";
import { StatsPanel } from "./StatsPanel";
import { Spinner } from "./Spinner";
import { ErrorMessage } from "./ErrorMessage";
import "./LookupView.css";

type Tab = "lookup" | "history" | "stats";

type LookupResult =
    | { kind: "dns"; data: LookupResponse }
    | { kind: "traceroute"; data: TracerouteResponse }
    | { kind: "whois"; data: WhoisResponse }
    | { kind: "asn"; data: AsnResponse }
    | { kind: "ptr"; data: PtrResponse };

const TABS: Tab[] = ["lookup", "history", "stats"];

/**
 * Renders the authenticated dashboard with tabbed navigation.
 *
 * @returns The dashboard JSX.
 */
export function LookupView() {
    const [activeTab, setActiveTab] = useState<Tab>("lookup");
    const [lookupType, setLookupType] = useState<LookupType>("dns");
    const [result, setResult] = useState<Option<LookupResult>>(None);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Option<string>>(None);

    async function handleLookup(value: string) {
        setIsLoading(true);
        setResult(None);
        setError(None);
        try {
            switch (lookupType) {
                case "dns": {
                    const r = await lookupDomain(value);
                    match(r, {
                        Ok: (data) => {
                            setResult(Some({ kind: "dns", data }));
                        },
                        Err: (msg) => {
                            setError(Some(msg));
                        },
                    });
                    break;
                }
                case "traceroute": {
                    const r = await lookupTraceroute(value);
                    match(r, {
                        Ok: (data) => {
                            setResult(Some({ kind: "traceroute", data }));
                        },
                        Err: (msg) => {
                            setError(Some(msg));
                        },
                    });
                    break;
                }
                case "whois": {
                    const r = await lookupWhois(value);
                    match(r, {
                        Ok: (data) => {
                            setResult(Some({ kind: "whois", data }));
                        },
                        Err: (msg) => {
                            setError(Some(msg));
                        },
                    });
                    break;
                }
                case "asn": {
                    const r = await lookupAsn(value);
                    match(r, {
                        Ok: (data) => {
                            setResult(Some({ kind: "asn", data }));
                        },
                        Err: (msg) => {
                            setError(Some(msg));
                        },
                    });
                    break;
                }
                case "ptr": {
                    const r = await lookupPtr(value);
                    match(r, {
                        Ok: (data) => {
                            setResult(Some({ kind: "ptr", data }));
                        },
                        Err: (msg) => {
                            setError(Some(msg));
                        },
                    });
                    break;
                }
                default: {
                    const _exhaustiveCheck: never = lookupType;
                    throw new Error(
                        `Unhandled lookup type: ${_exhaustiveCheck}`,
                    );
                }
            }
        } finally {
            setIsLoading(false);
        }
    }

    function handleTypeChange(type: LookupType) {
        setLookupType(type);
        setResult(None);
        setError(None);
    }

    function renderResult() {
        return match(result, {
            Some: (r) => {
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
                        return renderPtrResult(r.data);
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
                    {renderResult()}
                </>
            )}

            <HistoryPanel hidden={activeTab !== "history"} />
            <StatsPanel hidden={activeTab !== "stats"} />
        </div>
    );
}

function renderPtrResult(data: PtrResponse) {
    return (
        <div className="lookup-result">
            <div className="lookup-result__header">
                <h2 className="lookup-result__title">
                    PTR Lookup for {data.ip}
                </h2>
            </div>
            <div className="lookup-result__body">
                {data.hostnames.length === 0 ? (
                    <p className="lookup-result__empty">No hostnames found</p>
                ) : (
                    <ul className="lookup-result__list">
                        {data.hostnames.map((h) => (
                            <li key={h} className="lookup-result__list-item">
                                {h}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
