/**
 * @file tracerouteService.ts
 * @fileoverview Wraps the `nodejs-traceroute` event-based API in a Promise
 * that collects hops and resolves with an Option-based result.
 *
 * @author Ozan Malcı
 */
import { type Option, Some, None } from "oxide.ts";
import Traceroute from "nodejs-traceroute";

export interface TracerouteHop {
    hopNumber: number;
    ip: string;
    rtt1: Option<number>;
}

export interface TracerouteResult {
    destinationIp: Option<string>;
    hops: TracerouteHop[];
}

const TRACEROUTE_TIMEOUT_MS = 60_000;

/**
 * Parses the raw `rtt1` string from the traceroute library into an Option<number>.
 *
 * The library emits `rtt1` as a string that may be:
 * - `"1.234 ms"` (Linux/macOS traceroute)
 * - `"<1 ms"` or `"12 ms"` (Windows tracert)
 * - `"*"` (timed out hop)
 *
 * @param rtt1 The raw RTT string from the library.
 * @returns `Some(parsed)` for a valid RTT value, or `None` for timeouts / unparseable values.
 */
function parseRtt(rtt1: string): Option<number> {
    const trimmed = rtt1.trim();
    if (trimmed === "*") {
        return None;
    }
    const num = parseFloat(
        trimmed.replace(/[<>]/g, "").replace(/ms/i, "").trim(),
    );
    return Number.isNaN(num) ? None : Some(num);
}

/**
 * Runs a traceroute to the given domain.
 *
 * Wraps the event-based `nodejs-traceroute` API in a Promise:
 * - Collects hops from the `hop` event, parsing `rtt1` via `parseRtt`.
 * - Captures the resolved destination IP from the `destination` event.
 * - Enforces a 60-second timeout via `process.kill(pid)`.
 * - Rejects with a descriptive error if the command is not found (exit code 127).
 *
 * @param domain The domain or IP to trace.
 * @returns A promise that resolves with the collected hops and destination IP.
 */
export async function runTraceroute(domain: string): Promise<TracerouteResult> {
    return new Promise((resolve, reject) => {
        const tracer = new Traceroute();
        let destinationIp: Option<string> = None;
        const hops: TracerouteHop[] = [];
        let killTimer: ReturnType<typeof setTimeout> | null = null;
        let settled = false;

        function finish(result: TracerouteResult): void {
            if (settled) {
                return;
            }
            settled = true;
            if (killTimer) {
                clearTimeout(killTimer);
            }
            resolve(result);
        }

        function fail(error: Error): void {
            if (settled) {
                return;
            }
            settled = true;
            if (killTimer) {
                clearTimeout(killTimer);
            }
            reject(error);
        }

        tracer.on("pid", (pid: number) => {
            killTimer = setTimeout(() => {
                try {
                    process.kill(pid, "SIGTERM");
                } catch {
                    // The child process may have already exited or the signal
                    // is not supported on this platform (e.g. Windows).
                }
                finish({ destinationIp, hops });
            }, TRACEROUTE_TIMEOUT_MS);
        });

        tracer.on("destination", (dest: string) => {
            destinationIp = Some(dest);
        });

        tracer.on("hop", (hop: { hop: number; ip: string; rtt1: string }) => {
            hops.push({
                hopNumber: hop.hop,
                ip: hop.ip,
                rtt1: parseRtt(hop.rtt1),
            });
        });

        tracer.on("close", (code: number) => {
            if (code === 127) {
                fail(
                    new Error(
                        "Traceroute command not found. Please ensure traceroute (Linux/macOS) or tracert (Windows) is installed.",
                    ),
                );
                return;
            }
            finish({ destinationIp, hops });
        });

        try {
            tracer.trace(domain);
        } catch (err: unknown) {
            fail(
                new Error(
                    `Failed to start traceroute: ${err instanceof Error ? err.message : String(err)}`,
                ),
            );
        }
    });
}
