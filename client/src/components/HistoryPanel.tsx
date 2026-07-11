/**
 * @file HistoryPanel.tsx
 * @fileoverview Paginated timeline of past lookups across all types.
 *
 * @author Ozan Malcı
 */
import { useEffect, useRef, useState } from "react";
import { type Option, Some, None, match } from "oxide.ts";
import { fetchHistory } from "../api";
import type { HistoryItem } from "../types";
import { Spinner } from "./Spinner";
import { ErrorMessage } from "./ErrorMessage";
import "./HistoryPanel.css";

const PAGE_SIZE = 25;

/**
 * Renders a paginated list of lookup history items.
 *
 * @returns The history panel JSX.
 */
export function HistoryPanel() {
    const [items, setItems] = useState<HistoryItem[]>([]);
    const [hasMore, setHasMore] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Option<string>>(None);
    const pageRef = useRef(1);
    const initialFetchDone = useRef(false);

    async function loadPage(page: number) {
        setIsLoading(true);
        setError(None);
        try {
            match(await fetchHistory(page, PAGE_SIZE), {
                Ok: (data) => {
                    setItems((prev) => [...prev, ...data.items]);
                    setHasMore(data.hasMore);
                    pageRef.current = page;
                },
                Err: (msg) => {
                    setError(Some(msg));
                },
            });
        } finally {
            setIsLoading(false);
        }
    }

    function handleLoadMore() {
        void loadPage(pageRef.current + 1);
    }

    useEffect(() => {
        if (initialFetchDone.current) {
            return;
        }
        initialFetchDone.current = true;
        void loadPage(1);
    }, []);

    return (
        <div className="history-panel">
            {match(error, {
                Some: (msg) => <ErrorMessage message={msg} />,
                None: () => null,
            })}

            {items.length === 0 && !isLoading && match(error, {
                Some: () => null,
                None: () => (
                    <p className="history-panel__empty">
                        No lookups yet. Run a lookup to see it here.
                    </p>
                ),
            })}

            {items.length > 0 && (
                <div className="history-panel__list">
                    {items.map((item) => (
                        <div
                            key={`${item.kind}-${String(item.id)}`}
                            className="history-item"
                        >
                            <div className="history-item__header">
                                <span
                                    className={`history-item__kind history-item__kind--${item.kind}`}
                                >
                                    {item.kind.toUpperCase()}
                                </span>
                                <time className="history-item__time">
                                    {new Date(
                                        item.createdAt,
                                    ).toLocaleString()}
                                </time>
                                {item.isCached && (
                                    <span className="history-item__cache-badge">
                                        cached
                                    </span>
                                )}
                            </div>
                            <div className="history-item__body">
                                {renderItemDetails(item)}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {hasMore && (
                <button
                    type="button"
                    className="history-panel__load-more"
                    onClick={handleLoadMore}
                    disabled={isLoading}
                >
                    {isLoading ? "Loading..." : "Load more"}
                </button>
            )}

            {isLoading && items.length === 0 && <Spinner text="Loading history..." />}
        </div>
    );
}

function renderItemDetails(item: HistoryItem) {
    switch (item.kind) {
        case "dns":
            return (
                <span className="history-item__detail">
                    {item.domain}
                    {" \u2014 "}A:{item.recordCounts.a}{" "}
                    AAAA:{item.recordCounts.aaaa}{" "}
                    MX:{item.recordCounts.mx}{" "}
                    NS:{item.recordCounts.ns}
                </span>
            );
        case "traceroute":
            return (
                <span className="history-item__detail">
                    {item.domain}
                    {item.destinationIp !== null &&
                        ` \u2192 ${item.destinationIp}`}
                    {" \u2014 "}
                    {item.hopCount} hops
                </span>
            );
        case "whois":
            return (
                <span className="history-item__detail">
                    {item.domain}
                    {item.registrar !== null &&
                        ` \u2014 ${item.registrar}`}
                </span>
            );
        case "asn":
            return (
                <span className="history-item__detail">
                    {item.ip}
                    {item.asNumber !== null &&
                        ` \u2014 AS${String(item.asNumber)}`}
                    {item.asName !== null && ` ${item.asName}`}
                </span>
            );
        default: {
            const _exhaustiveCheck: never = item;
            throw new Error(
                `Unhandled history item kind: ${_exhaustiveCheck}`,
            );
        }
    }
}
