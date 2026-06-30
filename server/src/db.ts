/**
 * @file db.ts
 * @fileoverview Prisma client singleton. One instance shared across all services.
 *
 * @author Ozan Malcı
 */
import { PrismaClient } from "./generated/prisma/client.js";

export const prisma = new PrismaClient();
