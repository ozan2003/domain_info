/**
 * @file useLookup.ts
 * @fileoverview Encapsulates lookup form state, async execution, and error
 * handling for all five lookup types.
 *
 * @author Ozan Malcı
 */
import { useState } from "react";
import { type Result, type Option, Some, None, match } from "oxide.ts";
import {
    lookupDomain,
    lookupTraceroute,
    lookupWhois,
    lookupAsn,
    lookupPtr,
} from "../api";
import type {
    AsnResponse,
    LookupResponse,
    LookupType,
    PtrResponse,
    TracerouteResponse,
    WhoisResponse,
} from "../types";

export type LookupResult =
    | { kind: "dns"; data: LookupResponse }
    | { kind: "traceroute"; data: TracerouteResponse }
    | { kind: "whois"; data: WhoisResponse }
    | { kind: "asn"; data: AsnResponse }
    | { kind: "ptr"; data: PtrResponse };

type LookupCall = (value: string) => Promise<Result<LookupResult, string>>;

const LOOKUP_CALLS: Record<LookupType, LookupCall> = {
    dns: async (value) =>
        (await lookupDomain(value)).map((data) => ({
            kind: "dns" as const,
            data,
        })),
    traceroute: async (value) =>
        (await lookupTraceroute(value)).map((data) => ({
            kind: "traceroute" as const,
            data,
        })),
    whois: async (value) =>
        (await lookupWhois(value)).map((data) => ({
            kind: "whois" as const,
            data,
        })),
    asn: async (value) =>
        (await lookupAsn(value)).map((data) => ({
            kind: "asn" as const,
            data,
        })),
    ptr: async (value) =>
        (await lookupPtr(value)).map((data) => ({
            kind: "ptr" as const,
            data,
        })),
};

export interface UseLookupReturn {
    lookupType: LookupType;
    result: Option<LookupResult>;
    isLoading: boolean;
    error: Option<string>;
    handleTypeChange: (type: LookupType) => void;
    handleLookup: (value: string) => Promise<void>;
}

/**
 * Hook that owns lookup state and executes the appropriate API call for the
 * currently selected lookup type.
 *
 * @returns Lookup state and handlers.
 */
export function useLookup(): UseLookupReturn {
    const [lookupType, setLookupType] = useState<LookupType>("dns");
    const [result, setResult] = useState<Option<LookupResult>>(None);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Option<string>>(None);

    function handleTypeChange(type: LookupType) {
        setLookupType(type);
        setResult(None);
        setError(None);
    }

    async function handleLookup(value: string) {
        setIsLoading(true);
        setResult(None);
        setError(None);

        try {
            const lookupResult = await LOOKUP_CALLS[lookupType](value);
            match(lookupResult, {
                Ok: (data) => {
                    setResult(Some(data));
                },
                Err: (msg) => {
                    setError(Some(msg));
                },
            });
        } finally {
            setIsLoading(false);
        }
    }

    return {
        lookupType,
        result,
        isLoading,
        error,
        handleTypeChange,
        handleLookup,
    };
}
