import * as z from "zod";

export const lookupQuerySchema = z.object({
    domain: z
        .string()
        .trim()
        .min(1, "domain is required")
        // Most search engines can't cope with domains longer than 2048 characters.
        .max(2048, "domain is too long"),
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
