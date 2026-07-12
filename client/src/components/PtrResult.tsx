/**
 * @file PtrResult.tsx
 * @fileoverview Renders full PTR (reverse DNS) lookup result.
 *
 * @author Ozan Malcı
 */
import type { PtrResponse } from "../types";
import "./LookupView.css";

interface PtrResultProps {
    data: PtrResponse;
}

/**
 * Renders the hostnames resolved from a PTR lookup.
 *
 * @param data The PTR lookup response.
 * @returns The PTR result JSX.
 */
export function PtrResult({ data }: PtrResultProps) {
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
