import { execSync } from "node:child_process";
import { existsSync, unlinkSync } from "node:fs";
import { beforeAll, afterAll, beforeEach } from "vitest";
import { prisma } from "../src/db.js";

const TEST_DB_PATH = process.env.DATABASE_URL?.replace(/^file:/, "") ?? "";

beforeAll(() => {
    // Delete stale test DB from a previous run (if any).
    if (existsSync(TEST_DB_PATH)) {
        unlinkSync(TEST_DB_PATH);
    }

    // Run Prisma migrations on the test database.
    execSync("npx prisma migrate deploy", {
        env: { ...process.env },
        stdio: "pipe",
    });
});

beforeEach(async () => {
    // Clean ALL tables between tests so each test starts fresh.
    // Order matters due to foreign keys (delete children before parents).
    await prisma.aRecord.deleteMany();
    await prisma.aAAARecord.deleteMany();
    await prisma.mXRecord.deleteMany();
    await prisma.nSRecord.deleteMany();
    await prisma.tXTRecord.deleteMany();
    await prisma.cNAMERecord.deleteMany();
    await prisma.lookup.deleteMany();
    await prisma.hop.deleteMany();
    await prisma.traceroute.deleteMany();
    await prisma.whois.deleteMany();
    await prisma.aSNLookup.deleteMany();
    await prisma.user.deleteMany();
});

afterAll(async () => {
    await prisma.$disconnect();

    if (existsSync(TEST_DB_PATH)) {
        unlinkSync(TEST_DB_PATH);
    }
});
