/**
 * @file WhoisResult.tsx
 * @fileoverview Renders full WHOIS lookup result.
 *
 * @author Ozan Malcı
 */
import type { WhoisResponse } from "../types";
import { RecordSection } from "./RecordSection";
import "./ResultCard.css";

interface WhoisResultProps {
    data: WhoisResponse;
}

export function WhoisResult({ data }: WhoisResultProps) {
    return (
        <div className="result-card">
            <div className="result-card__header">
                <h2 className="result-card__title">WHOIS for {data.domain}</h2>
                {data.isCached && (
                    <span className="result-card__badge">cached</span>
                )}
            </div>
            <div className="result-card__body">
                <div className="result-card__fields">
                    <span className="result-card__field-label">Registrar</span>
                    <span className="result-card__field-value">
                        {data.registrar.unwrapOr("-")}
                    </span>
                    <span className="result-card__field-label">Created</span>
                    <span className="result-card__field-value">
                        {data.creationDate.unwrapOr("-")}
                    </span>
                    <span className="result-card__field-label">Expires</span>
                    <span className="result-card__field-value">
                        {data.expirationDate.unwrapOr("-")}
                    </span>
                </div>
                {data.nameServers.length > 0 && (
                    <div className="result-card__section">
                        <h3 className="result-card__section-title">
                            Name Servers
                        </h3>
                        <ul className="result-card__list">
                            {data.nameServers.map((ns) => (
                                <li key={ns} className="result-card__list-item">
                                    {ns}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                <div className="result-card__section">
                    <RecordSection
                        label="RAW DATA"
                        count={1}
                        shouldStartExpanded={false}
                    >
                        <pre className="result-card__pre">{data.rawData}</pre>
                    </RecordSection>
                </div>
            </div>
        </div>
    );
}
