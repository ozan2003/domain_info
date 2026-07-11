/**
 * @file TracerouteResult.tsx
 * @fileoverview Renders full traceroute lookup result.
 *
 * @author Ozan Malcı
 */
import type { TracerouteResponse } from "../types";
import "./ResultCard.css";

interface TracerouteResultProps {
    data: TracerouteResponse;
}

export function TracerouteResult({ data }: TracerouteResultProps) {
    return (
        <div className="result-card">
            <div className="result-card__header">
                <h2 className="result-card__title">
                    Traceroute for {data.domain}
                </h2>
                {data.isCached && (
                    <span className="result-card__badge">cached</span>
                )}
            </div>
            <div className="result-card__body">
                <div className="result-card__fields">
                    <span className="result-card__field-label">
                        Destination IP
                    </span>
                    <span className="result-card__field-value">
                        {data.destinationIp.unwrapOr("unreachable")}
                    </span>
                    <span className="result-card__field-label">Hop count</span>
                    <span className="result-card__field-value">
                        {data.hops.length}
                    </span>
                </div>
                {data.hops.length > 0 && (
                    <table className="result-card__table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>IP</th>
                                <th>RTT (ms)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.hops.map((hop) => (
                                <tr key={hop.hopNumber}>
                                    <td>{hop.hopNumber}</td>
                                    <td>{hop.ip}</td>
                                    <td>
                                        {hop.rtt1 !== null
                                            ? hop.rtt1.toFixed(2)
                                            : "*"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
