/**
 * @file HistoryPanel.tsx
 * @fileoverview Paginated, expandable timeline of past lookups across all types.
 * Clicking an item header fetches the full result and renders it inline.
 *
 * @author Ozan Malcı
 */
import { useEffect, useRef, useState } from "react";
import { type Option, Some, None, match } from "oxide.ts";
import { fetchHistory, fetchHistoryDetail } from "../api";
import type { HistoryDetail, HistoryItem } from "../types";
import { Spinner } from "./Spinner";
import { ErrorMessage } from "./ErrorMessage";
import { ResultsPanel } from "./ResultsPanel";
import { TracerouteResult } from "./TracerouteResult";
import { WhoisResult } from "./WhoisResult";
import { AsnResult } from "./AsnResult";
import { NETWORK_ERROR_MESSAGE } from "../constants";
import "./HistoryPanel.css";

const PAGE_SIZE = 25;

interface DetailState {
    isLoading: boolean;
    error: Option<string>;
    data: Option<HistoryDetail>;
}

interface HistoryPanelProps {
    hidden?: boolean;
}

function detailKey(item: HistoryItem): string {
    return `${item.kind}-${String(item.id)}`;
}

/**
 * Renders a paginated, expandable list of lookup history items.
 *
 * @param hidden When true, the panel is hidden but its state is preserved
 *   (used to keep history loaded across tab switches).
 * @returns The history panel JSX.
 */
export function HistoryPanel({ hidden = false }: HistoryPanelProps = {}) {
    const [items, setItems] = useState<HistoryItem[]>([]);
    const [hasMore, setHasMore] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Option<string>>(None);
    const [paginationError, setPaginationError] =
        useState<Option<string>>(None);
    const [detailMap, setDetailMap] = useState<Map<string, DetailState>>(
        new Map(),
    );
    const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
    const pageRef = useRef(1);
    const failedAppendPageRef = useRef<Option<number>>(None);
    const detailControllers = useRef<Map<string, AbortController>>(new Map());

    const updateDetail = (key: string, patch: Partial<DetailState>) => {
        setDetailMap((prev) => {
            const next = new Map(prev);
            const current: DetailState = prev.get(key) ?? {
                isLoading: false,
                error: None,
                data: None,
            };
            next.set(key, { ...current, ...patch });
            return next;
        });
    };

    async function loadPage(
        page: number,
        mode: "replace" | "append",
        signal?: AbortSignal,
    ) {
        setIsLoading(true);
        if (mode === "replace") {
            setError(None);
            setPaginationError(None);
        }
        try {
            const result = await fetchHistory(page, PAGE_SIZE, signal);
            if (signal?.aborted) {
                return;
            }
            match(result, {
                Ok: (data) => {
                    if (mode === "replace") {
                        setItems(data.items);
                    } else {
                        setItems((prev) => [...prev, ...data.items]);
                    }
                    setHasMore(data.hasMore);
                    pageRef.current = page;
                    setError(None);
                    setPaginationError(None);
                    failedAppendPageRef.current = None;
                },
                Err: (msg) => {
                    if (mode === "replace") {
                        setError(Some(msg));
                        return;
                    }
                    setPaginationError(Some(msg));
                    failedAppendPageRef.current = Some(page);
                },
            });
        } catch {
            if (signal?.aborted) {
                return;
            }
            if (mode === "replace") {
                setError(Some(NETWORK_ERROR_MESSAGE));
                return;
            }
            setPaginationError(Some(NETWORK_ERROR_MESSAGE));
            failedAppendPageRef.current = Some(page);
        } finally {
            if (!signal?.aborted) {
                setIsLoading(false);
            }
        }
    }

    function handleLoadMore() {
        void loadPage(pageRef.current + 1, "append");
    }

    useEffect(() => {
        const controller = new AbortController();
        void (async () => {
            setIsLoading(true);
            setError(None);
            setPaginationError(None);
            try {
                const result = await fetchHistory(
                    1,
                    PAGE_SIZE,
                    controller.signal,
                );
                if (controller.signal.aborted) {
                    return;
                }
                match(result, {
                    Ok: (data) => {
                        setItems(data.items);
                        setHasMore(data.hasMore);
                        pageRef.current = 1;
                        setError(None);
                        setPaginationError(None);
                        failedAppendPageRef.current = None;
                    },
                    Err: (msg) => {
                        setError(Some(msg));
                    },
                });
            } catch {
                if (controller.signal.aborted) {
                    return;
                }
                setError(Some(NETWORK_ERROR_MESSAGE));
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            }
        })();
        return () => {
            controller.abort();
        };
    }, []);

    useEffect(() => {
        const controllers = detailControllers.current;
        return () => {
            for (const controller of controllers.values()) {
                controller.abort();
            }
            controllers.clear();
        };
    }, []);

    function fetchDetail(item: HistoryItem) {
        const key = detailKey(item);
        detailControllers.current.get(key)?.abort();
        updateDetail(key, { isLoading: true, error: None });

        const controller = new AbortController();
        detailControllers.current.set(key, controller);

        void (async () => {
            try {
                const result = await fetchHistoryDetail(
                    item.kind,
                    item.id,
                    controller.signal,
                );
                detailControllers.current.delete(key);
                if (controller.signal.aborted) {
                    return;
                }
                match(result, {
                    Ok: (detail) => {
                        updateDetail(key, {
                            isLoading: false,
                            error: None,
                            data: Some(detail),
                        });
                    },
                    Err: (msg) => {
                        updateDetail(key, {
                            isLoading: false,
                            error: Some(msg),
                            data: None,
                        });
                    },
                });
            } catch {
                detailControllers.current.delete(key);
            }
        })();
    }

    function handleToggle(item: HistoryItem) {
        const key = detailKey(item);
        const isExpanded = expandedKeys.has(key);

        if (isExpanded) {
            setExpandedKeys((prev) => {
                const next = new Set(prev);
                next.delete(key);
                return next;
            });
            return;
        }

        setExpandedKeys((prev) => {
            const next = new Set(prev);
            next.add(key);
            return next;
        });

        if (detailMap.get(key)?.data.isSome()) {
            return;
        }

        fetchDetail(item);
    }

    function handleDetailRetry(item: HistoryItem) {
        fetchDetail(item);
    }

    function handleRetry() {
        match(failedAppendPageRef.current, {
            Some: (page) => {
                void loadPage(page, "append");
            },
            None: () => {
                void loadPage(1, "replace");
            },
        });
    }

    function renderExpandedBody(item: HistoryItem) {
        const key = detailKey(item);
        const detail = detailMap.get(key);
        if (!detail) {
            return null;
        }

        return (
            <div className="history-item__detail-body">
                {detail.isLoading && (
                    <div className="history-item__detail-loading">
                        <Spinner text="Loading detail..." />
                    </div>
                )}
                {match(detail.error, {
                    Some: (msg) => (
                        <ErrorMessage
                            message={msg}
                            onRetry={() => {
                                handleDetailRetry(item);
                            }}
                        />
                    ),
                    None: () => null,
                })}
                {match(detail.data, {
                    Some: (d) => renderDetail(d),
                    None: () => null,
                })}
            </div>
        );
    }

    return (
        <div className="history-panel" hidden={hidden}>
            {match(error, {
                Some: (msg) => (
                    <ErrorMessage message={msg} onRetry={handleRetry} />
                ),
                None: () => null,
            })}

            {items.length === 0 &&
                !isLoading &&
                match(error, {
                    Some: () => null,
                    None: () => (
                        <p className="history-panel__empty">
                            No lookups yet. Run a one to see it here.
                        </p>
                    ),
                })}

            {items.length > 0 && (
                <div className="history-panel__list">
                    {items.map((item) => {
                        const key = detailKey(item);
                        const isExpanded = expandedKeys.has(key);

                        return (
                            <div key={key} className="history-item">
                                <button
                                    type="button"
                                    className={`history-item__header${isExpanded ? " history-item__header--expanded" : ""}`}
                                    onClick={() => {
                                        handleToggle(item);
                                    }}
                                    aria-expanded={isExpanded}
                                >
                                    <span
                                        className={`history-item__kind history-item__kind--${item.kind}`}
                                    >
                                        {item.kind.toUpperCase()}
                                    </span>
                                    <time className="history-item__time">
                                        {dateToLocalISOString(item.createdAt)}
                                    </time>
                                    {item.isCached && (
                                        <span className="history-item__cache-badge">
                                            cached
                                        </span>
                                    )}
                                    <span
                                        className={`history-item__chevron${isExpanded ? " history-item__chevron--open" : ""}`}
                                        aria-hidden="true"
                                    >
                                        <ChevronIcon />
                                    </span>
                                </button>
                                <div className="history-item__body">
                                    {renderItemDetails(item)}
                                    {isExpanded && renderExpandedBody(item)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {items.length > 0 &&
                match(paginationError, {
                    Some: (msg) => (
                        <ErrorMessage message={msg} onRetry={handleRetry} />
                    ),
                    None: () => null,
                })}

            {isLoading && items.length > 0 && (
                <div className="history-panel__loading-more">
                    <Spinner text="Loading more..." />
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

            {isLoading && items.length === 0 && (
                <Spinner text="Loading history..." />
            )}
        </div>
    );
}

function renderItemDetails(item: HistoryItem) {
    switch (item.kind) {
        case "dns":
            return (
                <span className="history-item__detail">
                    {item.domain}
                    {" - "}A:{item.recordCounts.a} AAAA:
                    {item.recordCounts.aaaa} MX:{item.recordCounts.mx} NS:
                    {item.recordCounts.ns}
                </span>
            );
        case "traceroute":
            return (
                <span className="history-item__detail">
                    {item.domain}
                    {item.destinationIp.mapOr("", (ip) => ` \u2192 ${ip}`)}
                    {" - "}
                    {item.hopCount} hops
                </span>
            );
        case "whois":
            return (
                <span className="history-item__detail">
                    {item.domain}
                    {item.registrar.mapOr("", (r) => ` - ${r}`)}
                </span>
            );
        case "asn":
            return (
                <span className="history-item__detail">
                    {item.ip}
                    {item.asNumber.mapOr("", (n) => ` - AS${String(n)}`)}
                    {item.asName.mapOr("", (n) => ` ${n}`)}
                </span>
            );
        default: {
            const _exhaustiveCheck: never = item;
            throw new Error(`Unhandled history item kind: ${_exhaustiveCheck}`);
        }
    }
}

function renderDetail(detail: HistoryDetail) {
    switch (detail.kind) {
        case "dns":
            return <ResultsPanel data={detail.data} />;
        case "traceroute":
            return <TracerouteResult data={detail.data} />;
        case "whois":
            return <WhoisResult data={detail.data} />;
        case "asn":
            return <AsnResult data={detail.data} />;
        default: {
            const _exhaustiveCheck: never = detail;
            throw new Error(`Unhandled detail kind: ${_exhaustiveCheck}`);
        }
    }
}

/**
 * Convert a Date to a local ISO string (YYYY-MM-DDTHH:mm:ss) without timezone offset.
 *
 * @param date The Date object to convert.
 * @returns A string in the format "YYYY-MM-DDTHH:mm:ss".
 */
function dateToLocalISOString(date: string): string {
    const offsetMs = new Date(date).getTimezoneOffset() * 60 * 1000;
    const msLocal = new Date(date).getTime() - offsetMs;
    const dateLocal = new Date(msLocal);
    const iso = dateLocal.toISOString();
    const isoLocal = iso.slice(0, 19);
    return isoLocal;
}

function ChevronIcon() {
    return (
        <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M3 5l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
