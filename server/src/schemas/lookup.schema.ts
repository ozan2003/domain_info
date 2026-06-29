import * as z from "zod";

export const lookupQuerySchema = z.object({
    domain: z
        .string()
        .trim()
        .min(1, "domain is required")
        // 253 is the max length of a DNS name.
        // https://web.archive.org/web/20190518124533/https://devblogs.microsoft.com/oldnewthing/?p=7873
        .max(253, "domain is too long")
        .regex(
            /^(?!-)[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/,
            "invalid domain format",
        ),
});

export const mxRecordSchema = z.object({
    exchange: z.string(),
    priority: z.number().int(),
});

export const lookupResponseSchema = z.object({
    domain: z.string(),
    a: z.array(z.string()),
    mx: z.array(mxRecordSchema),
    ns: z.array(z.string()),
    txt: z.array(z.array(z.string())),
    cname: z.array(z.string()),
});

export type LookupQuery = z.infer<typeof lookupQuerySchema>;
export type LookupResponse = z.infer<typeof lookupResponseSchema>;
export type MXRecord = z.infer<typeof mxRecordSchema>;
