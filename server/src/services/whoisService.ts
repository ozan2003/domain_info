/**
 * @file whoisService.ts
 * @fileoverview Fetches and normalizes WHOIS data for a domain.
 *
 * @author Ozan Malcı
 */
import { lookup } from "whois";
import { type Option, Some, None } from "oxide.ts";
import {
    WHOIS_LOOKUP_FAILED_ERROR_MSG,
    WHOIS_NO_DATA_ERROR_MSG,
} from "../constants.js";

export type WhoisLookupResult = {
    rawData: string;
    registrar: Option<string>;
    creationDate: Option<string>;
    expirationDate: Option<string>;
    nameServers: string[];
};

function asText(data: string | { server: string; data: string }[]): string {
    if (typeof data === "string") {
        return data;
    }

    return data
        .map((entry) => `${entry.server}\n${entry.data}`.trim())
        .join("\n\n");
}

function firstMatch(text: string, patterns: RegExp[]): Option<string> {
    for (const pattern of patterns) {
        const match = text.match(pattern);
        const value = match?.[1]?.trim();

        if (value) {
            return Some(value);
        }
    }

    return None;
}

function parseNameServers(text: string): string[] {
    const servers = new Set<string>();
    const patterns = [
        /^Name Server:\s*(.+)$/gim,
        /^nserver:\s*(.+)$/gim,
        /^nameserver:\s*(.+)$/gim,
    ];

    for (const pattern of patterns) {
        for (const match of text.matchAll(pattern)) {
            const value = match[1]?.trim();
            if (value) {
                servers.add(value.replace(/\.$/, ""));
            }
        }
    }

    return [...servers];
}

function parseWhoisText(rawData: string): Omit<WhoisLookupResult, "rawData"> {
    return {
        registrar: firstMatch(rawData, [
            /^Registrar:\s*(.+)$/im,
            /^Sponsoring Registrar:\s*(.+)$/im,
            /^registrar:\s*(.+)$/im,
        ]),
        creationDate: firstMatch(rawData, [
            /^Creation Date:\s*(.+)$/im,
            /^Created On:\s*(.+)$/im,
            /^Registered On:\s*(.+)$/im,
            /^Domain Registration Date:\s*(.+)$/im,
        ]),
        expirationDate: firstMatch(rawData, [
            /^Expiration Date:\s*(.+)$/im,
            /^Registry Expiry Date:\s*(.+)$/im,
            /^Expiry Date:\s*(.+)$/im,
        ]),
        nameServers: parseNameServers(rawData),
    };
}

function toErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message.trim()) {
        return error.message;
    }

    return WHOIS_LOOKUP_FAILED_ERROR_MSG;
}

/**
 * Fetches WHOIS data for a domain and normalizes the response shape.
 *
 * @param domain The domain to look up.
 * @returns A normalized WHOIS result.
 */
export async function lookupWhois(domain: string): Promise<WhoisLookupResult> {
    return await new Promise<WhoisLookupResult>((resolve, reject) => {
        lookup(domain, (error, data) => {
            if (error) {
                reject(new Error(toErrorMessage(error)));
                return;
            }

            const rawData = asText(data);
            if (!rawData.trim()) {
                reject(new Error(WHOIS_NO_DATA_ERROR_MSG));
                return;
            }

            resolve({
                rawData,
                ...parseWhoisText(rawData),
            });
        });
    });
}
