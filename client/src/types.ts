/**
 * @file types.ts
 * @fileoverview TypeScript interfaces mirroring the server's Zod schemas.
 *
 * @author Ozan Malcı
 */

import type { Option } from "oxide.ts";

export interface MXRecord {
    exchange: string;
    priority: number;
}

export interface LookupResponse {
    domain: string;
    isCached: boolean;
    createdAt: string;
    a: string[];
    aaaa: string[];
    mx: MXRecord[];
    ns: string[];
    txt: string[];
    cname: string[];
}

export interface AuthUser {
    userId: number;
    email: string;
}

export type LookupType = "dns" | "traceroute" | "whois" | "asn" | "ptr";

export interface TracerouteHop {
    hopNumber: number;
    ip: string;
    rtt1: number | null;
}

export interface TracerouteResponse {
    domain: string;
    destinationIp: Option<string>;
    isCached: boolean;
    createdAt: string;
    hops: TracerouteHop[];
}

export interface WhoisResponse {
    domain: string;
    registrar: Option<string>;
    creationDate: Option<string>;
    expirationDate: Option<string>;
    nameServers: string[];
    rawData: string;
    isCached: boolean;
    createdAt: string;
}

export interface AsnResponse {
    ip: string;
    asNumber: Option<number>;
    asName: Option<string>;
    prefix: Option<string>;
    isCached: boolean;
    createdAt: string;
}

export interface PtrResponse {
    ip: string;
    hostnames: string[];
}

export interface RecordCounts {
    a: number;
    aaaa: number;
    mx: number;
    ns: number;
    txt: number;
    cname: number;
}

export interface DnsHistoryItem {
    kind: "dns";
    id: number;
    domain: string;
    isCached: boolean;
    createdAt: string;
    recordCounts: RecordCounts;
}

export interface TracerouteHistoryItem {
    kind: "traceroute";
    id: number;
    domain: string;
    destinationIp: Option<string>;
    isCached: boolean;
    hopCount: number;
    createdAt: string;
}

export interface WhoisHistoryItem {
    kind: "whois";
    id: number;
    domain: string;
    registrar: Option<string>;
    isCached: boolean;
    createdAt: string;
}

export interface AsnHistoryItem {
    kind: "asn";
    id: number;
    ip: string;
    asNumber: Option<number>;
    asName: Option<string>;
    prefix: Option<string>;
    isCached: boolean;
    createdAt: string;
}

export type HistoryItem =
    | DnsHistoryItem
    | TracerouteHistoryItem
    | WhoisHistoryItem
    | AsnHistoryItem;

export interface HistoryResponse {
    items: HistoryItem[];
    page: number;
    pageSize: number;
    hasMore: boolean;
}

export interface CacheHitRatio {
    total: number;
    cached: number;
    ratio: number;
}

export interface TopDomainEntry {
    domain: string;
    count: number;
}

export interface TopRegistrarEntry {
    registrar: string;
    count: number;
}

export interface TopAsnEntry {
    asNumber: Option<number>;
    asName: Option<string>;
    count: number;
}

export interface TopFirstHopEntry {
    ip: string;
    count: number;
}

export interface StatsResponse {
    totals: {
        dns: number;
        traceroute: number;
        whois: number;
        asn: number;
    };
    cacheHitRatio: {
        dns: CacheHitRatio;
        traceroute: CacheHitRatio;
        whois: CacheHitRatio;
        asn: CacheHitRatio;
    };
    topDomains: {
        dns: TopDomainEntry[];
        traceroute: TopDomainEntry[];
        whois: TopDomainEntry[];
    };
    traceroute: {
        avgHopCount: Option<number>;
        topFirstHops: TopFirstHopEntry[];
    };
    whois: {
        topRegistrars: TopRegistrarEntry[];
    };
    asn: {
        topAsns: TopAsnEntry[];
    };
}
