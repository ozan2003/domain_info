import { defineConfig } from "vitest/config";
import path from "node:path";

const testDbPath = path.resolve(import.meta.dirname, "prisma", "test.db");

export default defineConfig({
    test: {
        env: {
            DATABASE_URL: `file:${testDbPath}`,
            JWT_SECRET: "test-jwt-secret-do-not-use-in-production",
            NODE_ENV: "test",
        },
        globals: true,
        setupFiles: ["./tests/setup.ts"],
    },
});
