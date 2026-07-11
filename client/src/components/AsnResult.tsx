/**
 * @file AsnResult.tsx
 * @fileoverview Renders full ASN lookup result.
 *
 * @author Ozan Malcı
 */
import type { AsnResponse } from "../types";
import "./ResultCard.css";

interface AsnResultProps {
    data: AsnResponse;
}

export function AsnResult({ data }: AsnResultProps) {
    return (
        <div className="result-card">
            <div className="result-card__header">
                <h2 className="result-card__title">ASN Lookup for {data.ip}</h2>
                {data.isCached && (
                    <span className="result-card__badge">cached</span>
                )}
            </div>
            <div className="result-card__body">
                <div className="result-card__fields">
                    <span className="result-card__field-label">AS Number</span>
                    <span className="result-card__field-value">
                        {data.asNumber.mapOr("-", (num) => `AS${String(num)}`)}
                    </span>
                    <span className="result-card__field-label">AS Name</span>
                    <span className="result-card__field-value">
                        {data.asName.unwrapOr("-")}
                    </span>
                    <span className="result-card__field-label">Prefix</span>
                    <span className="result-card__field-value">
                        {data.prefix.unwrapOr("-")}
                    </span>
                </div>
            </div>
        </div>
    );
}
