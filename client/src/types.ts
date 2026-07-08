/**
 * @file types.ts
 * @fileoverview TypeScript interfaces for the DNS lookup API responses.
 * Mirrors the server's Zod schemas in `lookup.schema.ts`.
 *
 * @author Ozan Malcı
 */

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
