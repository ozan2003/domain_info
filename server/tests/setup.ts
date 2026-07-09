import { execSync } from "node:child_process";
import { beforeAll, afterAll, beforeEach } from "vitest";
import { prisma } from "../src/db.js";

beforeAll(() => {
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
});
