/**
 * @file ResultsPanel.tsx
 * @fileoverview Displays DNS lookup results as collapsible accordion sections.
 *
 * @author Ozan Malcı
 */
import type { LookupResponse } from "../types";
import { RecordSection } from "./RecordSection";
import "./ResultsPanel.css";

const INFO_TEXTS = {
    A: "Address records. They map a domain name to one or more IPv4 (32-bit) addresses.",
    MX: "Mail Exchange records. They list the mail servers that accept email for the domain, ordered by priority.",
    NS: "Name Server records. They delegate the domain to the authoritative name servers that serve its records.",
    TXT: "Text records. They hold arbitrary text, commonly used for SPF, DKIM, DMARC, and ownership verification.",
    CNAME: "Canonical Name records. They alias one name to another; the target itself is resolved through DNS.",
};

interface ResultsPanelProps {
    data: LookupResponse;
}

/**
 * Render a panel with returned DNS results.
 *
 * Each record type (A, MX, NS, TXT, CNAME) is rendered as a separate
 * `RecordSection` component.
 *
 * @param data The DNS lookup results to display.
 * @returns The results panel JSX.
 */
export function ResultsPanel({ data }: ResultsPanelProps) {
    return (
        <>
            <div className="results-panel">
                <h2 className="results-panel__domain">{data.domain}</h2>

                <RecordSection
                    label="A"
                    count={data.a.length}
                    copiedText={data.a.join("\n")}
                    infoText={INFO_TEXTS.A}
                >
                    <ul className="record-list">
                        {data.a.map((record) => (
                            <li key={record} className="record-list__item">
                                {record}
                            </li>
                        ))}
                    </ul>
                </RecordSection>

                <RecordSection
                    label="MX"
                    count={data.mx.length}
                    copiedText={data.mx
                        .map(
                            (record) =>
                                `${String(record.priority)} ${record.exchange}`,
                        )
                        .join("\n")}
                    infoText={INFO_TEXTS.MX}
                >
                    <ul className="record-list">
                        {data.mx.map((record) => (
                            <li
                                key={`${String(record.priority)}-${record.exchange}`}
                                className="record-list__item"
                            >
                                <div className="record-list__mx">
                                    <span className="record-list__mx-priority">
                                        {record.priority}
                                    </span>
                                    <span>{record.exchange}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </RecordSection>

                <RecordSection
                    label="NS"
                    count={data.ns.length}
                    copiedText={data.ns.join("\n")}
                    infoText={INFO_TEXTS.NS}
                >
                    <ul className="record-list">
                        {data.ns.map((record) => (
                            <li key={record} className="record-list__item">
                                {record}
                            </li>
                        ))}
                    </ul>
                </RecordSection>

                <RecordSection
                    label="TXT"
                    count={data.txt.length}
                    copiedText={data.txt
                        .map((chunks) => chunks.join(""))
                        .join("\n")}
                    infoText={INFO_TEXTS.TXT}
                >
                    <ul className="record-list">
                        {data.txt.map((chunks, index) => (
                            <li key={index} className="record-list__item">
                                {chunks.join("")}
                            </li>
                        ))}
                    </ul>
                </RecordSection>

                <RecordSection
                    label="CNAME"
                    count={data.cname.length}
                    copiedText={data.cname.join("\n")}
                    infoText={INFO_TEXTS.CNAME}
                >
                    <ul className="record-list">
                        {data.cname.map((record) => (
                            <li key={record} className="record-list__item">
                                {record}
                            </li>
                        ))}
                    </ul>
                </RecordSection>
            </div>
        </>
    );
}
