/**
 * @file StatsPanel.tsx
 * @fileoverview Dashboard showing aggregate lookup statistics.
 *
 * @author Ozan Malcı
 */
import { useEffect, useState } from "react";
import { type Option, Some, None, match } from "oxide.ts";
import { fetchStats } from "../api";
import type { StatsResponse, TopDomainEntry } from "../types";
import { Spinner } from "./Spinner";
import { ErrorMessage } from "./ErrorMessage";
import { NETWORK_ERROR_MESSAGE } from "../constants";
import "./StatsPanel.css";

const LOOKUP_KINDS = ["dns", "traceroute", "whois", "asn"] as const;
type LookupKind = (typeof LOOKUP_KINDS)[number];

const KIND_LABELS: Record<LookupKind, string> = {
    dns: "DNS",
    traceroute: "Traceroute",
    whois: "WHOIS",
    asn: "ASN",
};

/**
 * Renders the statistics dashboard with totals, cache ratios, and top lists.
 *
 * @param hidden When true, the panel is hidden but its state is preserved
 *   (used to keep stats loaded across tab switches).
 * @returns The stats panel JSX.
 */
export function StatsPanel({ hidden = false }: { hidden?: boolean } = {}) {
    const [stats, setStats] = useState<Option<StatsResponse>>(None);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Option<string>>(None);

    useEffect(() => {
        const controller = new AbortController();
        void (async () => {
            setIsLoading(true);
            setError(None);
            try {
                const result = await fetchStats(controller.signal);
                if (controller.signal.aborted) {
                    return;
                }
                match(result, {
                    Ok: (data) => {
                        setStats(Some(data));
                        setError(None);
                    },
                    Err: (msg) => {
                        setStats(None);
                        setError(Some(msg));
                    },
                });
            } catch {
                if (controller.signal.aborted) {
                    return;
                }
                setStats(None);
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

    function loadStats() {
        setIsLoading(true);
        setError(None);
        void (async () => {
            try {
                const result = await fetchStats();
                match(result, {
                    Ok: (data) => {
                        setStats(Some(data));
                        setError(None);
                    },
                    Err: (msg) => {
                        setStats(None);
                        setError(Some(msg));
                    },
                });
            } catch {
                setStats(None);
                setError(Some(NETWORK_ERROR_MESSAGE));
            } finally {
                setIsLoading(false);
            }
        })();
    }

    function handleRetry() {
        loadStats();
    }

    if (isLoading) {
        return (
            <div className="stats-panel" hidden={hidden}>
                <Spinner text="Loading statistics..." />
            </div>
        );
    }

    return (
        <div className="stats-panel" hidden={hidden}>
            {match(error, {
                Some: (msg) => (
                    <ErrorMessage message={msg} onRetry={handleRetry} />
                ),
                None: () => null,
            })}
            {match(stats, {
                Some: (s) => (
                    <>
                        <StatsTotals totals={s.totals} />
                        <CacheHitRatioBars cacheHitRatio={s.cacheHitRatio} />
                        <TopDomainsSection topDomains={s.topDomains} />
                        <TracerouteSection data={s.traceroute} />
                        <WhoisSection data={s.whois} />
                        <AsnSection data={s.asn} />
                    </>
                ),
                None: () => null,
            })}
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*  Totals                                                                    */
/* -------------------------------------------------------------------------- */

interface StatsTotalsProps {
    totals: StatsResponse["totals"];
}

function StatsTotals({ totals }: StatsTotalsProps) {
    return (
        <section className="stats-section">
            <h3 className="stats-section__title">Totals</h3>
            <div className="stats-totals">
                {LOOKUP_KINDS.map((kind) => (
                    <div key={kind} className="stats-card">
                        <span className="stats-card__value">
                            {totals[kind]}
                        </span>
                        <span className="stats-card__label">
                            {KIND_LABELS[kind]}
                        </span>
                    </div>
                ))}
            </div>
        </section>
    );
}

/* -------------------------------------------------------------------------- */
/*  Cache Hit Ratio                                                           */
/* -------------------------------------------------------------------------- */

interface CacheHitRatioBarsProps {
    cacheHitRatio: StatsResponse["cacheHitRatio"];
}

function CacheHitRatioBars({ cacheHitRatio }: CacheHitRatioBarsProps) {
    return (
        <section className="stats-section">
            <h3 className="stats-section__title">Cache Hit Ratio</h3>
            <div className="stats-bars">
                {LOOKUP_KINDS.map((kind) => {
                    const ratio = cacheHitRatio[kind];
                    const pct = Math.round(ratio.ratio * 100);
                    return (
                        <div key={kind} className="stats-bar">
                            <span className="stats-bar__label">
                                {KIND_LABELS[kind]}
                            </span>
                            <div className="stats-bar__track">
                                <div
                                    className="stats-bar__fill"
                                    style={{ width: `${String(pct)}%` }}
                                />
                            </div>
                            <span className="stats-bar__value">
                                {ratio.cached}/{ratio.total} ({pct}%)
                            </span>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

/* -------------------------------------------------------------------------- */
/*  Top Domains                                                               */
/* -------------------------------------------------------------------------- */

interface TopDomainsSectionProps {
    topDomains: StatsResponse["topDomains"];
}

function TopDomainsSection({ topDomains }: TopDomainsSectionProps) {
    return (
        <section className="stats-section">
            <h3 className="stats-section__title">Top Domains</h3>
            <TopDomainsList label="DNS" entries={topDomains.dns} />
            <TopDomainsList
                label="Traceroute"
                entries={topDomains.traceroute}
            />
            <TopDomainsList label="WHOIS" entries={topDomains.whois} />
        </section>
    );
}

interface TopDomainsListProps {
    label: string;
    entries: TopDomainEntry[];
}

function TopDomainsList({ label, entries }: TopDomainsListProps) {
    if (entries.length === 0) {
        // Couldn't use `None` there because it brings so much friction in other JSX code.
        return null;
    }
    return (
        <div className="stats-top-domains">
            <h4 className="stats-subsection__title">{label}</h4>
            <table className="stats-table">
                <thead>
                    <tr>
                        <th>Domain</th>
                        <th>Count</th>
                    </tr>
                </thead>
                <tbody>
                    {entries.map((entry) => (
                        <tr key={entry.domain}>
                            <td>{entry.domain}</td>
                            <td>{entry.count}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*  Traceroute                                                                */
/* -------------------------------------------------------------------------- */

interface TracerouteSectionProps {
    data: StatsResponse["traceroute"];
}

function TracerouteSection({ data }: TracerouteSectionProps) {
    if (data.topFirstHops.length === 0 && data.avgHopCount.isNone()) {
        return null;
    }
    return (
        <section className="stats-section">
            <h3 className="stats-section__title">Traceroute</h3>
            {match(data.avgHopCount, {
                Some: (v) => (
                    <p className="stats-metric">
                        Average hop count: <strong>{v.toFixed(1)}</strong>
                    </p>
                ),
                None: () => null,
            })}
            {data.topFirstHops.length > 0 && (
                <>
                    <h4 className="stats-subsection__title">
                        Top First-Hop IPs
                    </h4>
                    <table className="stats-table">
                        <thead>
                            <tr>
                                <th>IP</th>
                                <th>Count</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.topFirstHops.map((hop) => (
                                <tr key={hop.ip}>
                                    <td>{hop.ip}</td>
                                    <td>{hop.count}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}
        </section>
    );
}

/* -------------------------------------------------------------------------- */
/*  WHOIS                                                                     */
/* -------------------------------------------------------------------------- */

interface WhoisSectionProps {
    data: StatsResponse["whois"];
}

function WhoisSection({ data }: WhoisSectionProps) {
    if (data.topRegistrars.length === 0) {
        return null;
    }
    return (
        <section className="stats-section">
            <h3 className="stats-section__title">WHOIS</h3>
            <h4 className="stats-subsection__title">Top Registrars</h4>
            <table className="stats-table">
                <thead>
                    <tr>
                        <th>Registrar</th>
                        <th>Count</th>
                    </tr>
                </thead>
                <tbody>
                    {data.topRegistrars.map((r) => (
                        <tr key={r.registrar}>
                            <td>{r.registrar}</td>
                            <td>{r.count}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>
    );
}

/* -------------------------------------------------------------------------- */
/*  ASN                                                                       */
/* -------------------------------------------------------------------------- */

interface AsnSectionProps {
    data: StatsResponse["asn"];
}

function AsnSection({ data }: AsnSectionProps) {
    if (data.topAsns.length === 0) {
        return null;
    }
    return (
        <section className="stats-section">
            <h3 className="stats-section__title">ASN</h3>
            <h4 className="stats-subsection__title">Top AS Numbers</h4>
            <table className="stats-table">
                <thead>
                    <tr>
                        <th>ASN</th>
                        <th>Name</th>
                        <th>Count</th>
                    </tr>
                </thead>
                <tbody>
                    {data.topAsns.map((asn, idx) => (
                        <tr key={String(idx)}>
                            <td>
                                {asn.asNumber.mapOr(
                                    "-",
                                    (num) => `AS${String(num)}`,
                                )}
                            </td>
                            <td>{asn.asName.unwrapOr("-")}</td>
                            <td>{asn.count}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>
    );
}
