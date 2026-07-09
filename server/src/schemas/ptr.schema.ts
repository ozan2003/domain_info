import * as z from "zod";
import { asnQuerySchema } from "./asn.schema.js";

// Same as ASN query as we just require an IP address.
export const ptrQuerySchema = asnQuerySchema;

export const ptrResponseSchema = z.object({
    ip: z.string(),
    hostnames: z.array(z.string()),
});

export type PtrQuery = z.infer<typeof ptrQuerySchema>;
export type PtrResponse = z.infer<typeof ptrResponseSchema>;
