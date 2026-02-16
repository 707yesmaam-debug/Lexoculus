// Prisma config for ComplianceAI
import { config } from "dotenv";
import { defineConfig } from "@prisma/config";

// Load .env.local
config({ path: ".env.local" });

export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
    },
    datasource: {
        // Force direct connection (port 5432) for migrations/introspection to avoid pooler timeout
        // In production (Vercel), DIRECT_URL might not be set, so fallback to DATABASE_URL
        url: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
    },
});
