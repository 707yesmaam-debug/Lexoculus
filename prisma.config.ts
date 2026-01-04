// Prisma config for ComplianceAI
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Load .env.local
config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Use pooled connection (port 6543)
    url: process.env.DATABASE_URL!,
  },
});
