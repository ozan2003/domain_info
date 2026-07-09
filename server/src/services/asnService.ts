/**
 * @file asnService.ts
 * @fileoverview Fetches and normalizes ASN data for an IP via Team Cymru DNS queries.
 *
 * Two TXT queries are issued:
 *   1. `<reversed-octets>.origin.asn.cymru.com` -> "AS | prefix | country | registry | date"
 *   2. `AS<as>.asn.cymru.com`                    -> "AS | country | registry | date | AS name"
 *
 * The first yields the originating AS and the announced prefix; the second yields the
 * AS description (`asName`). If either query fails the corresponding field is left null.
 *
 * @author Ozan Malcı
 */
import { promises as dns } from "node:dns";
import { isIP } from "node:net";
import { type Option, Some, None } from "oxide.ts";

export type AsnLookupResult = {
    ip: string;
    asNumber: Option<number>;
    asName: Option<string>;
    prefix: Option<string>;
};

async function resolveTxtQuiet(query: string): Promise<Option<string>> {
    const records = await dns.resolveTxt(query);
    const flattened = records.map((parts) => parts.join("")).join("");
    return flattened.trim() ? Some(flattened.trim()) : None;
}

/** Reverses the IP into the DNS label expected by Team Cymru. */
function originQuery(ip: string): string {
    const family = isIP(ip);
    if (family === 4) {
        // 8.8.8.8 -> 8.8.8.8.origin.asn.cymru.com (octets reversed)
        const reversed = ip.split(".").reverse().join(".");
        return `${reversed}.origin.asn.cymru.com`;
    }
    // IPv6: reverse the nibbles, one hex digit per label, append .origin6.asn.cymru.com
    const nibbles = ip
        .replace(/:/g, "")
        .toLowerCase()
        .split("")
        .reverse()
        .join(".");
    return `${nibbles}.origin6.asn.cymru.com`;
}

function parseOriginResponse(text: string): {
    asNumber: Option<number>;
    prefix: Option<string>;
} {
    const fields = text.split("|").map((part) => part.trim());

    const rawAs = fields[0]?.replace(/^AS/i, "").trim() ?? "";
    const asNumber: Option<number> = /^\d+$/.test(rawAs)
        ? Some(Number(rawAs))
        : None;

    const prefix: Option<string> = fields[1] ? Some(fields[1]) : None;

    return { asNumber, prefix };
}

function parseAsnDescriptionResponse(text: string): Option<string> {
    // Example: "15169 | US | arin | 2000-03-30 | GOOGLE, US"
    const fields = text.split("|").map((part) => part.trim());

    if (fields.length < 5) {
        // Fall back to the last field.
        const last = fields[fields.length - 1];
        return last && last.toUpperCase() !== "OTHER" ? Some(last) : None;
    }

    const name = fields.slice(4).join("|").trim();
    if (!name || name.toUpperCase() === "OTHER") {
        return None;
    }
    return Some(name);
}

/**
 * Performs an ASN lookup for the given IP via Team Cymru DNS.
 *
 * @param ip The IPv4 or IPv6 address to look up.
 * @returns A normalized ASN result. Fields that cannot be resolved are `None`.
 */
export async function lookupAsn(ip: string): Promise<AsnLookupResult> {
    if (isIP(ip) === 0) {
        throw new Error("invalid ip address");
    }

    const originText = await resolveTxtQuiet(originQuery(ip));

    if (originText.isNone()) {
        return {
            ip,
            asNumber: None,
            asName: None,
            prefix: None,
        };
    }

    const origin = originText.unwrap();

    const { asNumber, prefix } = parseOriginResponse(origin);

    let asName: Option<string> = None;
    if (asNumber.isSome()) {
        const descriptionText = await resolveTxtQuiet(
            `AS${asNumber.unwrap()}.asn.cymru.com`,
        );
        if (descriptionText.isSome()) {
            asName = parseAsnDescriptionResponse(descriptionText.unwrap());
        }
    }

    return {
        ip,
        asNumber,
        asName,
        prefix,
    };
}
