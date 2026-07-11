/**
 * @file api.ts
 * @fileoverview API client for the DNS lookup server.
 *
 * @author Ozan Malcı
 */
import type {
    AsnResponse,
    AuthUser,
    DnsHistoryItem,
    HistoryDetail,
    HistoryItem,
    HistoryResponse,
    LookupResponse,
    PtrResponse,
    StatsResponse,
    TracerouteResponse,
    WhoisResponse,
} from "./types";
import { Option, type Result, Ok, Err, Some, None } from "oxide.ts";

interface StatsWireResponse {
    totals: {
        dns: number;
        traceroute: number;
        whois: number;
        asn: number;
    };
    cacheHitRatio: {
        dns: { total: number; cached: number; ratio: number };
        traceroute: { total: number; cached: number; ratio: number };
        whois: { total: number; cached: number; ratio: number };
        asn: { total: number; cached: number; ratio: number };
    };
    topDomains: {
        dns: { domain: string; count: number }[];
        traceroute: { domain: string; count: number }[];
        whois: { domain: string; count: number }[];
    };
    traceroute: {
        avgHopCount: number | null;
        topFirstHops: { ip: string; count: number }[];
    };
    whois: {
        topRegistrars: { registrar: string; count: number }[];
    };
    asn: {
        topAsns: {
            asNumber: number | null;
            asName: string | null;
            count: number;
        }[];
    };
}

function mapStatsResponse(data: StatsWireResponse): StatsResponse {
    return {
        ...data,
        traceroute: {
            avgHopCount: Option.from(data.traceroute.avgHopCount),
            topFirstHops: data.traceroute.topFirstHops,
        },
        asn: {
            topAsns: data.asn.topAsns.map((asn) => ({
                asNumber: Option.from(asn.asNumber),
                asName: Option.from(asn.asName),
                count: asn.count,
            })),
        },
    };
}

/**
 * Reads a human-readable error message from a failed response.
 *
 * @param response The fetch Response that was not ok.
 * @returns The error string from the body, or a status-based fallback.
 */
async function readErrorMessage(response: Response): Promise<string> {
    const body = (await response.json().catch(() => null)) as {
        error?: string;
        message?: string;
    } | null;
    return (
        body?.error ??
        body?.message ??
        `Request failed (${String(response.status)})`
    );
}

/**
 * Fetches DNS records for a given domain from the lookup API.
 *
 * @param domain The domain name to look up.
 * @returns `Ok(data)` on success, or `Err(message)` if the request fails.
 */
export async function lookupDomain(
    domain: string,
): Promise<Result<LookupResponse, string>> {
    const params = new URLSearchParams({ domain });
    const response = await fetch(`/api/lookup?${params.toString()}`);

    if (!response.ok) {
        return Err(await readErrorMessage(response));
    }

    const data = (await response.json()) as LookupResponse;
    return Ok(data);
}

/**
 * Fetches the currently authenticated user.
 *
 * @returns `Ok(Some(user))` if a valid session cookie is present, `Ok(None)`
 *   if not (401), or `Err(message)` on transport failure.
 */
export async function fetchMe(): Promise<Result<Option<AuthUser>, string>> {
    const response = await fetch("/api/auth/me");

    if (response.status === 401) {
        return Ok(None);
    }
    if (!response.ok) {
        return Err(await readErrorMessage(response));
    }

    const data = (await response.json()) as AuthUser;
    return Ok(Some(data));
}

interface AuthPayload {
    email: string;
    password: string;
}

/**
 * Posts a JSON body to an auth endpoint and returns the resulting user.
 *
 * @param path The auth endpoint path.
 * @param payload The email/password to send.
 * @returns `Ok(user)` on success, or `Err(message)` on failure.
 */
async function postAuth(
    path: string,
    payload: AuthPayload,
): Promise<Result<AuthUser, string>> {
    const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        return Err(await readErrorMessage(response));
    }

    const data = (await response.json()) as AuthUser;
    return Ok(data);
}

/**
 * Logs a user in by email and password. Sets the session cookie on success.
 *
 * @param email The user's email.
 * @param password The user's password.
 * @returns `Ok(user)` on success, or `Err(message)` on failure.
 */
export async function login(
    email: string,
    password: string,
): Promise<Result<AuthUser, string>> {
    return postAuth("/api/auth/login", { email, password });
}

/**
 * Registers a new user and logs them in.
 *
 * @param email The user's email.
 * @param password The user's password (min 8 chars per server schema).
 * @returns `Ok(user)` on success, or `Err(message)` on failure.
 */
export async function register(
    email: string,
    password: string,
): Promise<Result<AuthUser, string>> {
    return postAuth("/api/auth/register", { email, password });
}

/**
 * Logs the current user out by clearing the session cookie.
 *
 * @returns `Ok(null)` on success, or `Err(message)` on transport failure.
 */
// null is used as unit value
export async function logout(): Promise<Result<null, string>> {
    const response = await fetch("/api/auth/logout", { method: "POST" });
    if (!response.ok) {
        return Err(await readErrorMessage(response));
    }
    return Ok(null);
}

export async function lookupTraceroute(
    domain: string,
): Promise<Result<TracerouteResponse, string>> {
    const params = new URLSearchParams({ domain });
    const response = await fetch(`/api/traceroute?${params.toString()}`);
    if (!response.ok) {
        return Err(await readErrorMessage(response));
    }
    const raw = (await response.json()) as TracerouteWireResponse;
    return Ok(mapTracerouteFromWire(raw));
}

/**
 * Fetches WHOIS data for a given domain from the lookup API.
 *
 * @param domain The domain name to look up.
 * @returns `Ok(data)` on success, or `Err(message)` if the request fails.
 */
export async function lookupWhois(
    domain: string,
): Promise<Result<WhoisResponse, string>> {
    const params = new URLSearchParams({ domain });
    const response = await fetch(`/api/whois?${params.toString()}`);
    if (!response.ok) {
        return Err(await readErrorMessage(response));
    }
    const raw = (await response.json()) as WhoisWireResponse;
    return Ok(mapWhoisFromWire(raw));
}

/**
 * Fetches ASN data for a given IP address from the lookup API.
 *
 * @param ip The IP address to look up.
 * @returns `Ok(data)` on success, or `Err(message)` if the request fails.
 */
export async function lookupAsn(
    ip: string,
): Promise<Result<AsnResponse, string>> {
    const params = new URLSearchParams({ ip });
    const response = await fetch(`/api/asn?${params.toString()}`);
    if (!response.ok) {
        return Err(await readErrorMessage(response));
    }
    const raw = (await response.json()) as AsnWireResponse;
    return Ok(mapAsnFromWire(raw));
}

/**
 * Fetches PTR data for a given IP address from the lookup API.
 *
 * @param ip The IP address to look up.
 * @returns `Ok(data)` on success, or `Err(message)` if the request fails.
 */
export async function lookupPtr(
    ip: string,
): Promise<Result<PtrResponse, string>> {
    const params = new URLSearchParams({ ip });
    const response = await fetch(`/api/ptr?${params.toString()}`);
    if (!response.ok) {
        return Err(await readErrorMessage(response));
    }
    const data = (await response.json()) as PtrResponse;
    return Ok(data);
}

/**
 * Fetches a paginated history page for the authenticated user.
 *
 * @param page The 1-based page number to request.
 * @param pageSize Optional page size override.
 * @param signal Optional `AbortSignal` to cancel the request.
 * @returns `Ok(data)` on success, or `Err(message)` if the request fails.
 */
export async function fetchHistory(
    page: number,
    pageSize?: number,
    signal?: AbortSignal,
): Promise<Result<HistoryResponse, string>> {
    const params = new URLSearchParams({ page: String(page) });
    if (pageSize !== undefined) {
        params.set("pageSize", String(pageSize));
    }
    const response = await fetch(`/api/history?${params.toString()}`, {
        signal,
    });
    if (!response.ok) {
        return Err(await readErrorMessage(response));
    }
    const data = (await response.json()) as HistoryWireResponse;
    return Ok(mapHistoryFromWire(data));
}

/**
 * Fetches the authenticated user's aggregate lookup statistics.
 *
 * The raw API response uses `null` for missing values; this helper converts
 * those fields to `Option` so the UI can consume a consistent client shape.
 *
 * @param signal Optional `AbortSignal` to cancel the request.
 * @returns `Ok(data)` on success, or `Err(message)` if the request fails.
 */
export async function fetchStats(
    signal?: AbortSignal,
): Promise<Result<StatsResponse, string>> {
    const response = await fetch("/api/stats", { signal });
    if (!response.ok) {
        return Err(await readErrorMessage(response));
    }
    const data = (await response.json()) as StatsWireResponse;
    return Ok(mapStatsResponse(data));
}

interface TracerouteWireResponse {
    domain: string;
    destinationIp: string | null;
    isCached: boolean;
    createdAt: string;
    hops: { hopNumber: number; ip: string; rtt1: number | null }[];
}

interface WhoisWireResponse {
    domain: string;
    registrar: string | null;
    creationDate: string | null;
    expirationDate: string | null;
    nameServers: string[];
    rawData: string;
    isCached: boolean;
    createdAt: string;
}

interface AsnWireResponse {
    ip: string;
    asNumber: number | null;
    asName: string | null;
    prefix: string | null;
    isCached: boolean;
    createdAt: string;
}

function mapTracerouteFromWire(
    raw: TracerouteWireResponse,
): TracerouteResponse {
    return {
        ...raw,
        destinationIp: Option.from(raw.destinationIp),
    };
}

function mapWhoisFromWire(raw: WhoisWireResponse): WhoisResponse {
    return {
        ...raw,
        registrar: Option.from(raw.registrar),
        creationDate: Option.from(raw.creationDate),
        expirationDate: Option.from(raw.expirationDate),
    };
}

function mapAsnFromWire(raw: AsnWireResponse): AsnResponse {
    return {
        ...raw,
        asNumber: Option.from(raw.asNumber),
        asName: Option.from(raw.asName),
        prefix: Option.from(raw.prefix),
    };
}

interface TracerouteHistoryWireItem {
    kind: "traceroute";
    id: number;
    domain: string;
    destinationIp: string | null;
    isCached: boolean;
    hopCount: number;
    createdAt: string;
}

interface WhoisHistoryWireItem {
    kind: "whois";
    id: number;
    domain: string;
    registrar: string | null;
    isCached: boolean;
    createdAt: string;
}

interface AsnHistoryWireItem {
    kind: "asn";
    id: number;
    ip: string;
    asNumber: number | null;
    asName: string | null;
    prefix: string | null;
    isCached: boolean;
    createdAt: string;
}

type HistoryWireItem =
    | DnsHistoryItem
    | TracerouteHistoryWireItem
    | WhoisHistoryWireItem
    | AsnHistoryWireItem;

interface HistoryWireResponse {
    items: HistoryWireItem[];
    page: number;
    pageSize: number;
    hasMore: boolean;
}

function mapHistoryItemFromWire(item: HistoryWireItem): HistoryItem {
    switch (item.kind) {
        case "dns":
            return item;
        case "traceroute":
            return {
                ...item,
                destinationIp: Option.from(item.destinationIp),
            };
        case "whois":
            return {
                ...item,
                registrar: Option.from(item.registrar),
            };
        case "asn":
            return {
                ...item,
                asNumber: Option.from(item.asNumber),
                asName: Option.from(item.asName),
                prefix: Option.from(item.prefix),
            };
        default: {
            const _exhaustiveCheck: never = item;
            throw new Error(`Unhandled history wire item: ${_exhaustiveCheck}`);
        }
    }
}

function mapHistoryFromWire(raw: HistoryWireResponse): HistoryResponse {
    return {
        ...raw,
        items: raw.items.map(mapHistoryItemFromWire),
    };
}

/**
 * Fetches the full detail for a single history item.
 *
 * The raw API response uses `null` for missing values; this helper converts
 * those fields to `Option` so the UI receives a consistent shape.
 *
 * @param kind The lookup kind ("dns" | "traceroute" | "whois" | "asn").
 * @param id The database row ID of the history item.
 * @param signal Optional `AbortSignal` to cancel the request.
 * @returns `Ok(data)` on success, or `Err(message)` if the request fails.
 */
export async function fetchHistoryDetail(
    kind: HistoryItem["kind"],
    id: number,
    signal?: AbortSignal,
): Promise<Result<HistoryDetail, string>> {
    const response = await fetch(`/api/history/${kind}/${String(id)}`, {
        signal,
    });
    if (!response.ok) {
        return Err(await readErrorMessage(response));
    }
    switch (kind) {
        case "dns": {
            const data = (await response.json()) as LookupResponse;
            return Ok({ kind: "dns", data });
        }
        case "traceroute": {
            const raw = (await response.json()) as TracerouteWireResponse;
            return Ok({
                kind: "traceroute",
                data: mapTracerouteFromWire(raw),
            });
        }
        case "whois": {
            const raw = (await response.json()) as WhoisWireResponse;
            return Ok({ kind: "whois", data: mapWhoisFromWire(raw) });
        }
        case "asn": {
            const raw = (await response.json()) as AsnWireResponse;
            return Ok({ kind: "asn", data: mapAsnFromWire(raw) });
        }
        default: {
            const _exhaustiveCheck: never = kind;
            throw new Error(
                `Unhandled history kind: ${String(_exhaustiveCheck)}`,
            );
        }
    }
}
