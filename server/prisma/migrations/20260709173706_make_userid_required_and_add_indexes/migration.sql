/*
  Warnings:

  - Made the column `userId` on table `ASNLookup` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `Lookup` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `Traceroute` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `Whois` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ASNLookup" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ip" TEXT NOT NULL,
    "asNumber" INTEGER,
    "asName" TEXT,
    "prefix" TEXT,
    "cached" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "ASNLookup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ASNLookup" ("asName", "asNumber", "cached", "createdAt", "id", "ip", "prefix", "userId") SELECT "asName", "asNumber", "cached", "createdAt", "id", "ip", "prefix", "userId" FROM "ASNLookup";
DROP TABLE "ASNLookup";
ALTER TABLE "new_ASNLookup" RENAME TO "ASNLookup";
CREATE INDEX "ASNLookup_userId_createdAt_idx" ON "ASNLookup"("userId", "createdAt");
CREATE INDEX "ASNLookup_ip_createdAt_idx" ON "ASNLookup"("ip", "createdAt");
CREATE TABLE "new_Lookup" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "domain" TEXT NOT NULL,
    "cached" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "Lookup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Lookup" ("cached", "createdAt", "domain", "id", "userId") SELECT "cached", "createdAt", "domain", "id", "userId" FROM "Lookup";
DROP TABLE "Lookup";
ALTER TABLE "new_Lookup" RENAME TO "Lookup";
CREATE INDEX "Lookup_userId_createdAt_idx" ON "Lookup"("userId", "createdAt");
CREATE INDEX "Lookup_domain_createdAt_idx" ON "Lookup"("domain", "createdAt");
CREATE TABLE "new_Traceroute" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "domain" TEXT NOT NULL,
    "destinationIp" TEXT,
    "cached" BOOLEAN NOT NULL DEFAULT false,
    "hopCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "Traceroute_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Traceroute" ("cached", "createdAt", "destinationIp", "domain", "id", "userId") SELECT "cached", "createdAt", "destinationIp", "domain", "id", "userId" FROM "Traceroute";
DROP TABLE "Traceroute";
ALTER TABLE "new_Traceroute" RENAME TO "Traceroute";
CREATE INDEX "Traceroute_userId_createdAt_idx" ON "Traceroute"("userId", "createdAt");
CREATE INDEX "Traceroute_domain_createdAt_idx" ON "Traceroute"("domain", "createdAt");
CREATE TABLE "new_Whois" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "domain" TEXT NOT NULL,
    "rawData" TEXT NOT NULL,
    "registrar" TEXT,
    "creationDate" TEXT,
    "expirationDate" TEXT,
    "nameServers" TEXT,
    "cached" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "Whois_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Whois" ("cached", "createdAt", "creationDate", "domain", "expirationDate", "id", "nameServers", "rawData", "registrar", "userId") SELECT "cached", "createdAt", "creationDate", "domain", "expirationDate", "id", "nameServers", "rawData", "registrar", "userId" FROM "Whois";
DROP TABLE "Whois";
ALTER TABLE "new_Whois" RENAME TO "Whois";
CREATE INDEX "Whois_userId_createdAt_idx" ON "Whois"("userId", "createdAt");
CREATE INDEX "Whois_domain_createdAt_idx" ON "Whois"("domain", "createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
